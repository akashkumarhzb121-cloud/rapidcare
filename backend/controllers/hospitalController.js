const Hospital = require('../models/Hospital');
const Incident = require('../models/Incident');

const listHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find()
      .select('name location address specializations totalBeds availableBeds contactNumber')
      .sort('name');
    
    res.json({ hospitals });
  } catch (error) {
    console.error('List hospitals error:', error);
    res.status(500).json({ error: 'Failed to list hospitals' });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const { availableBeds } = req.body;
    
    if (availableBeds === undefined || availableBeds < 0) {
      return res.status(400).json({ error: 'Valid availableBeds value is required' });
    }
    
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    
    // Check if user is authorized to update this hospital
    if (req.userRole !== 'hospital_staff' || 
        !req.user.linkedHospitalId || 
        req.user.linkedHospitalId.toString() !== hospital._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this hospital' });
    }
    
    // Ensure available beds doesn't exceed total beds
    if (availableBeds > hospital.totalBeds) {
      return res.status(400).json({ error: 'Available beds cannot exceed total beds' });
    }
    
    hospital.availableBeds = availableBeds;
    await hospital.save();
    
    // Emit real-time event
    const io = req.app.get('io');
    io.to(`hospital_${hospital._id}`).emit('hospitalAvailabilityUpdated', {
      hospitalId: hospital._id,
      availableBeds: hospital.availableBeds,
      totalBeds: hospital.totalBeds
    });
    
    // Also emit to all operators
    io.emit('hospitalAvailabilityUpdated', {
      hospitalId: hospital._id,
      availableBeds: hospital.availableBeds,
      totalBeds: hospital.totalBeds
    });
    
    res.json({
      message: 'Availability updated successfully',
      hospital: {
        id: hospital._id,
        name: hospital.name,
        availableBeds: hospital.availableBeds,
        totalBeds: hospital.totalBeds
      }
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

const getHospitalIncidents = async (req, res) => {
  try {
    const hospitalId = req.params.id;
    
    // Check if user is authorized
    if (req.userRole !== 'hospital_staff' || 
        !req.user.linkedHospitalId || 
        req.user.linkedHospitalId.toString() !== hospitalId) {
      return res.status(403).json({ error: 'Not authorized to view this hospital\'s incidents' });
    }
    
    const incidents = await Incident.find({
      assignedHospitalId: hospitalId,
      status: { $in: ['dispatched', 'completed'] }
    })
    .sort('-createdAt')
    .populate('createdBy', 'name email');
    
    res.json({ incidents });
  } catch (error) {
    console.error('Get hospital incidents error:', error);
    res.status(500).json({ error: 'Failed to retrieve incidents' });
  }
};

module.exports = { listHospitals, updateAvailability, getHospitalIncidents };