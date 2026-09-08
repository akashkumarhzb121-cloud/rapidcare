const Incident = require('../models/Incident');
const Hospital = require('../models/Hospital');
const { analyzePatientCondition } = require('../services/aiService');
const { rankHospitals } = require('../services/distanceService');
const { geocodeLocation } = require('../services/locationService');

const createIncident = async (req, res) => {
  try {
    const { patientDescription, patientLocation, ambulanceLocation } = req.body;
    
    if (!patientDescription) {
      return res.status(400).json({ error: 'Patient description is required' });
    }
    
    console.log('\n=== Creating New Incident ===');
    console.log('Patient Description:', patientDescription);
    
    // Handle location - accept either address text or coordinates
    let finalLocation = ambulanceLocation;
    
    if (patientLocation && !ambulanceLocation) {
      // Geocode the address to get coordinates
      const geocoded = await geocodeLocation(patientLocation);
      if (geocoded) {
        // Convert address object to string representation
        const addressString = formatAddress(geocoded.address);
        
        finalLocation = {
          lat: geocoded.lat,
          lng: geocoded.lng,
          displayName: geocoded.displayName,
          address: addressString
        };
        console.log('Geocoded location:', geocoded.displayName);
      } else {
        return res.status(400).json({ 
          error: 'Could not find the specified location. Please try a different address.' 
        });
      }
    }
    
    // Ensure finalLocation has proper format
    if (!finalLocation) {
      return res.status(400).json({ error: 'Valid location is required' });
    }
    
    // Ensure lat and lng are numbers
    if (finalLocation.lat !== undefined) {
      finalLocation.lat = parseFloat(finalLocation.lat);
    }
    if (finalLocation.lng !== undefined) {
      finalLocation.lng = parseFloat(finalLocation.lng);
    }
    
    // Ensure address is a string
    if (finalLocation.address && typeof finalLocation.address === 'object') {
      finalLocation.address = formatAddress(finalLocation.address);
    }
    
    // Ensure displayName is a string
    if (finalLocation.displayName && typeof finalLocation.displayName === 'object') {
      finalLocation.displayName = formatAddress(finalLocation.displayName);
    }
    
    if (!finalLocation.lat || !finalLocation.lng) {
      return res.status(400).json({ error: 'Valid coordinates are required' });
    }
    
    console.log('Location:', finalLocation);
    
    // Analyze patient condition using AI
    const aiResponse = await analyzePatientCondition(patientDescription);
    console.log('AI Response:', aiResponse);
    
    // Create incident with AI response
    const incident = new Incident({
      patientDescription,
      severity: aiResponse.severity,
      requiredSpecialization: aiResponse.requiredSpecialization,
      aiReasoning: aiResponse.aiReasoning,
      ambulanceLocation: {
        lat: finalLocation.lat,
        lng: finalLocation.lng,
        address: finalLocation.address || finalLocation.displayName || 'Unknown location',
        displayName: finalLocation.displayName || finalLocation.address || 'Unknown location'
      },
      patientLocation: patientLocation || finalLocation.displayName || 'Unknown location',
      createdBy: req.userId
    });
    
    await incident.save();
    console.log('Incident saved:', incident._id);
    
    // Find matching hospitals
    const matchingHospitals = await Hospital.find({
      specializations: aiResponse.requiredSpecialization,
      availableBeds: { $gt: 0 }
    });
    
    console.log('Matching hospitals found:', matchingHospitals.length);
    
    // Rank hospitals by distance and availability
    const rankedHospitals = rankHospitals(matchingHospitals, {
      lat: finalLocation.lat,
      lng: finalLocation.lng
    });
    
    // Update incident status to matched if hospitals found
    if (rankedHospitals.length > 0) {
      incident.status = 'matched';
      await incident.save();
    }
    
    console.log('=== Incident Creation Complete ===\n');
    
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

// Helper function to format address object to string
function formatAddress(addressObj) {
  if (!addressObj) return '';
  
  if (typeof addressObj === 'string') {
    return addressObj;
  }
  
  const parts = [];
  
  // Extract common address fields
  const fields = ['road', 'suburb', 'neighbourhood', 'city', 'town', 'village', 
                  'state_district', 'state', 'postcode', 'country'];
  
  for (const field of fields) {
    if (addressObj[field]) {
      parts.push(addressObj[field]);
    }
  }
  
  return parts.join(', ') || 'Location provided';
}

const getIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('assignedHospitalId', 'name address contactNumber location')
      .populate('createdBy', 'name email');
    
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    res.json({ incident });
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ error: 'Failed to retrieve incident' });
  }
};

const dispatchIncident = async (req, res) => {
  try {
    const { hospitalId } = req.body;
    
    if (!hospitalId) {
      return res.status(400).json({ error: 'Hospital ID is required' });
    }
    
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    if (incident.status !== 'pending' && incident.status !== 'matched') {
      return res.status(400).json({ error: 'Incident cannot be dispatched in its current state' });
    }
    
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    if (hospital.availableBeds <= 0) {
      return res.status(400).json({ error: 'Hospital has no available beds' });
    }
    
    incident.assignedHospitalId = hospitalId;
    incident.status = 'dispatched';
    await incident.save();
    
    const io = req.app.get('io');
    io.to(`hospital_${hospitalId}`).emit('newIncidentAssigned', { incident });
    io.to(`incident_${incident._id}`).emit('incidentStatusChanged', { 
      incidentId: incident._id, 
      status: 'dispatched',
      hospitalId 
    });
    
    res.json({
      message: 'Incident dispatched successfully',
      incident
    });
  } catch (error) {
    console.error('Dispatch incident error:', error);
    res.status(500).json({ error: 'Failed to dispatch incident' });
  }
};

const completeIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    
    if (req.userRole !== 'hospital_staff' || 
        !req.user.linkedHospitalId || 
        req.user.linkedHospitalId.toString() !== incident.assignedHospitalId?.toString()) {
      return res.status(403).json({ error: 'Not authorized to complete this incident' });
    }
    
    if (incident.status !== 'dispatched') {
      return res.status(400).json({ error: 'Incident must be dispatched before completion' });
    }
    
    incident.status = 'completed';
    await incident.save();
    
    if (incident.assignedHospitalId) {
      const hospital = await Hospital.findById(incident.assignedHospitalId);
      if (hospital && hospital.availableBeds > 0) {
        hospital.availableBeds -= 1;
        await hospital.save();
        
        const io = req.app.get('io');
        io.to(`hospital_${hospital._id}`).emit('hospitalAvailabilityUpdated', {
          hospitalId: hospital._id,
          availableBeds: hospital.availableBeds,
          totalBeds: hospital.totalBeds
        });
      }
    }
    
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

module.exports = { createIncident, getIncident, dispatchIncident, completeIncident };
