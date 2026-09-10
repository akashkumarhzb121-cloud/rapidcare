const Incident = require('../models/Incident');
const Facility = require('../models/Facility');
const { analyzePatientCondition } = require('../services/aiService');
const { rankHospitals } = require('../services/distanceService');
const { geocodeLocation } = require('../services/locationService');

const createIncident = async (req, res) => {
  try {
    const { patientDescription, patientLocation, ambulanceLocation } = req.body;
    
    if (!patientDescription) {
      return res.status(400).json({ error: 'Patient description is required' });
    }
    
    let finalLocation = ambulanceLocation;
    
    if (patientLocation && !ambulanceLocation) {
      const geocoded = await geocodeLocation(patientLocation);
      if (geocoded) {
        finalLocation = {
          lat: geocoded.lat,
          lng: geocoded.lng,
          displayName: geocoded.displayName,
          address: formatAddress(geocoded.address)
        };
      } else {
        return res.status(400).json({ error: 'Could not find the specified location.' });
      }
    }
    
    if (!finalLocation || !finalLocation.lat || !finalLocation.lng) {
      return res.status(400).json({ error: 'Valid location is required' });
    }

    if (typeof finalLocation.address === 'object') {
      finalLocation.address = formatAddress(finalLocation.address);
    }
    
    const aiResponse = await analyzePatientCondition(patientDescription);
    
    const incident = new Incident({
      patientDescription,
      severity: aiResponse.severity,
      requiredSpecialization: aiResponse.requiredSpecialization,
      aiReasoning: aiResponse.aiReasoning,
      ambulanceLocation: {
        lat: parseFloat(finalLocation.lat),
        lng: parseFloat(finalLocation.lng),
        address: finalLocation.address || finalLocation.displayName || 'Unknown',
        displayName: finalLocation.displayName || finalLocation.address || 'Unknown'
      },
      patientLocation: patientLocation || finalLocation.displayName || '',
      createdBy: req.userId
    });
    
    await incident.save();
    
    const matchingHospitals = await Facility.find({
      specializations: aiResponse.requiredSpecialization,
      availableBeds: { $gt: 0 },
      facilityType: 'district-hospital'
    });
    
    const rankedHospitals = rankHospitals(matchingHospitals, {
      lat: parseFloat(finalLocation.lat),
      lng: parseFloat(finalLocation.lng)
    });
    
    if (rankedHospitals.length > 0) {
      incident.status = 'matched';
      await incident.save();
    }
    
    res.status(201).json({
      message: 'Incident created successfully',
      incident,
      matchedHospitals: rankedHospitals
    });
  } catch (error) {
    console.error('Incident creation error:', error);
    res.status(500).json({ error: 'Failed to create incident: ' + error.message });
  }
};

const getIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('assignedHospitalId', 'name address contactNumber location')
      .populate('createdBy', 'name email');
    
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json({ incident });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve incident' });
  }
};

const getFacilityIncidents = async (req, res) => {
  try {
    const facilityId = req.params.facilityId;
    const userFacility = req.user.linkedFacilityId || req.user.linkedHospitalId;
    
    if (req.userRole === 'hospital_staff' && userFacility?.toString() !== facilityId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const incidents = await Incident.find({
      assignedHospitalId: facilityId,
      status: { $in: ['dispatched', 'completed'] }
    })
    .populate('createdBy', 'name email')
    .populate('patientId', 'name age village')
    .sort('-createdAt');
    
    res.json({ incidents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve incidents' });
  }
};

// UPDATED: Bed count now decrements on DISPATCH
const dispatchIncident = async (req, res) => {
  try {
    const { hospitalId } = req.body;
    
    if (!hospitalId) {
      return res.status(400).json({ error: 'Hospital ID is required' });
    }
    
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    
    if (incident.status !== 'pending' && incident.status !== 'matched') {
      return res.status(400).json({ error: 'Incident cannot be dispatched in its current state' });
    }
    
    const hospital = await Facility.findById(hospitalId);
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    
    if (hospital.availableBeds <= 0) {
      return res.status(400).json({ error: 'Hospital has no available beds' });
    }
    
    // *** DECREMENT BED COUNT ON DISPATCH ***
    hospital.availableBeds -= 1;
    await hospital.save();
    console.log(`✓ Bed reserved at ${hospital.name}: ${hospital.availableBeds}/${hospital.totalBeds} remaining`);
    
    incident.assignedHospitalId = hospitalId;
    incident.status = 'dispatched';
    incident.bedReserved = true;
    await incident.save();
    
    const io = req.app.get('io');
    
    // Broadcast to hospital
    io.to(`hospital_${hospitalId}`).emit('newIncidentAssigned', { incident });
    io.to(`facility_${hospitalId}`).emit('newIncidentAssigned', { incident });
    
    // *** BROADCAST BED UPDATE TO ALL OPERATORS ***
    io.emit('hospitalAvailabilityUpdated', {
      hospitalId: hospital._id,
      facilityId: hospital._id,
      availableBeds: hospital.availableBeds,
      totalBeds: hospital.totalBeds,
      reason: 'incident_dispatched'
    });
    io.emit('facilityAvailabilityUpdated', {
      facilityId: hospital._id,
      availableBeds: hospital.availableBeds,
      totalBeds: hospital.totalBeds,
      reason: 'incident_dispatched'
    });
    
    io.to(`incident_${incident._id}`).emit('incidentStatusChanged', { 
      incidentId: incident._id, 
      status: 'dispatched',
      hospitalId,
      bedsRemaining: hospital.availableBeds
    });
    
    res.json({
      message: 'Incident dispatched successfully. Bed reserved.',
      incident,
      hospital: {
        id: hospital._id,
        name: hospital.name,
        availableBeds: hospital.availableBeds,
        totalBeds: hospital.totalBeds
      }
    });
  } catch (error) {
    console.error('Dispatch incident error:', error);
    res.status(500).json({ error: 'Failed to dispatch incident' });
  }
};

const completeIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    
    const userFacility = req.user.linkedFacilityId || req.user.linkedHospitalId;
    
    if (req.userRole !== 'hospital_staff') {
      return res.status(403).json({ error: 'Only hospital staff can complete incidents' });
    }
    
    if (!userFacility || userFacility.toString() !== incident.assignedHospitalId?.toString()) {
      return res.status(403).json({ error: 'This incident is assigned to a different hospital' });
    }
    
    if (incident.status !== 'dispatched') {
      return res.status(400).json({ error: 'Incident must be dispatched before completion' });
    }
    
    // Mark complete - bed already decremented on dispatch
    incident.status = 'completed';
    await incident.save();
    
    const io = req.app.get('io');
    io.to(`incident_${incident._id}`).emit('incidentStatusChanged', {
      incidentId: incident._id,
      status: 'completed'
    });
    
    res.json({
      message: 'Incident completed successfully',
      incident
    });
  } catch (error) {
    console.error('Complete incident error:', error);
    res.status(500).json({ error: 'Failed to complete incident' });
  }
};

function formatAddress(addressObj) {
  if (!addressObj) return '';
  if (typeof addressObj === 'string') return addressObj;
  const parts = [];
  const fields = ['road', 'suburb', 'city', 'town', 'village', 'state', 'postcode', 'country'];
  for (const f of fields) if (addressObj[f]) parts.push(addressObj[f]);
  return parts.join(', ') || 'Location provided';
}

module.exports = { 
  createIncident, 
  getIncident, 
  getFacilityIncidents,
  dispatchIncident, 
  completeIncident 
};
