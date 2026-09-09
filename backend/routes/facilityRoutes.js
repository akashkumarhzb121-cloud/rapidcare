const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const Referral = require('../models/Referral');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// List all facilities (public for now, can add auth later)
router.get('/', async (req, res) => {
  try {
    const { facilityType, district } = req.query;
    const query = {};
    if (facilityType) query.facilityType = facilityType;
    if (district) query.district = district;
    
    const facilities = await Facility.find(query)
      .select('name facilityType location address district specializations totalBeds availableBeds contactNumber')
      .sort('facilityType name');
    
    res.json({ facilities });
  } catch (error) {
    console.error('List facilities error:', error);
    res.status(500).json({ error: 'Failed to list facilities' });
  }
});

// Get facility dashboard (beds + medicine + diagnostics)
router.get('/:id/dashboard', authMiddleware, async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    
    // Get incoming referrals
    const incomingReferrals = await Referral.find({
      toFacilityId: facility._id,
      status: { $in: ['initiated', 'in-transit'] }
    }).populate('patientId', 'name age village').sort('-createdAt');
    
    // Get recent completed referrals
    const recentReferrals = await Referral.find({
      $or: [{ toFacilityId: facility._id }, { fromFacilityId: facility._id }]
    })
    .populate('patientId', 'name age')
    .populate('fromFacilityId', 'name facilityType')
    .populate('toFacilityId', 'name facilityType')
    .sort('-createdAt')
    .limit(10);
    
    res.json({
      facility,
      incomingReferrals,
      recentReferrals,
      stats: {
        totalIncoming: incomingReferrals.length,
        bedUtilization: facility.totalBeds > 0 
          ? Math.round(((facility.totalBeds - facility.availableBeds) / facility.totalBeds) * 100)
          : 0,
        medicineItems: facility.medicineStock.length,
        diagnosticServices: facility.diagnosticServices.filter(d => d.available).length
      }
    });
  } catch (error) {
    console.error('Facility dashboard error:', error);
    res.status(500).json({ error: 'Failed to get facility dashboard' });
  }
});

// Update facility availability (beds + medicine)
router.patch('/:id/availability', authMiddleware, roleMiddleware(['hospital_staff', 'community_health_worker']), async (req, res) => {
  try {
    const { availableBeds, medicineStock } = req.body;
    
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    
    // Check authorization
    if (req.userRole === 'hospital_staff' && 
        req.user.linkedFacilityId?.toString() !== facility._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this facility' });
    }
    
    if (availableBeds !== undefined) {
      facility.availableBeds = availableBeds;
    }
    
    if (medicineStock) {
      facility.medicineStock = medicineStock;
    }
    
    await facility.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`facility_${facility._id}`).emit('facilityAvailabilityUpdated', {
      facilityId: facility._id,
      availableBeds: facility.availableBeds,
      medicineStock: facility.medicineStock
    });
    
    res.json({ message: 'Facility updated', facility });
  } catch (error) {
    console.error('Update facility error:', error);
    res.status(500).json({ error: 'Failed to update facility' });
  }
});

module.exports = router;
