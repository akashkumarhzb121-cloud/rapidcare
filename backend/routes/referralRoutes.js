const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const referralService = require('../services/referralService');

router.use(authMiddleware);

// Create referral
router.post('/', roleMiddleware(['community_health_worker', 'ambulance_operator']), async (req, res) => {
  try {
    const result = await referralService.createReferral(req.body, req.userId);
    
    const io = req.app.get('io');
    
    // Broadcast new referral to the target facility
    io.to(`facility_${result.referral.toFacilityId}`).emit('newReferralReceived', {
      referral: result.referral
    });
    io.to(`hospital_${result.referral.toFacilityId}`).emit('newReferralReceived', {
      referral: result.referral
    });
    
    // If emergency, also notify about the incident
    if (result.incident) {
      io.to(`facility_${result.referral.toFacilityId}`).emit('newIncidentAssigned', {
        incident: result.incident
      });
    }
    
    res.status(201).json({
      message: result.incident 
        ? '🚨 Emergency referral created and incident dispatched' 
        : 'Referral created successfully',
      referral: result.referral,
      incident: result.incident,
      aiResponse: result.aiResponse,
      isEmergency: result.isEmergency,
      matchedHospitals: result.matchedHospitals || []
    });
  } catch (error) {
    console.error('Referral creation error:', error);
    res.status(500).json({ error: 'Failed to create referral: ' + error.message });
  }
});

// Update referral status - BROADCASTS TO BOTH FACILITIES
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, facilityId, notes } = req.body;
    const referral = await referralService.updateReferralStatus(
      req.params.id,
      status,
      req.userId,
      facilityId || req.user.linkedFacilityId,
      notes
    );
    
    const io = req.app.get('io');
    
    // Notify BOTH facilities
    io.to(`facility_${referral.toFacilityId}`).emit('referralStatusChanged', { referral });
    io.to(`facility_${referral.fromFacilityId}`).emit('referralStatusChanged', { referral });
    io.to(`hospital_${referral.toFacilityId}`).emit('referralStatusChanged', { referral });
    io.to(`hospital_${referral.fromFacilityId}`).emit('referralStatusChanged', { referral });
    
    // If accepted, broadcast follow-up creation
    if (status === 'received') {
      io.to(`facility_${referral.fromFacilityId}`).emit('followUpCreated', {
        referralId: referral._id,
        patientId: referral.patientId
      });
    }
    
    // Broadcast stats update to facility
    const stats = await referralService.getFacilityStats(referral.toFacilityId);
    io.to(`facility_${referral.toFacilityId}`).emit('facilityStatsUpdated', {
      facilityId: referral.toFacilityId,
      stats
    });
    
    res.json({ message: 'Referral status updated', referral });
  } catch (error) {
    console.error('Referral status update error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get referrals for facility
router.get('/facility/:facilityId', async (req, res) => {
  try {
    const { type } = req.query;
    const referrals = await referralService.getFacilityReferrals(req.params.facilityId, type);
    res.json({ referrals });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ error: 'Failed to get referrals' });
  }
});

// Get facility stats
router.get('/facility/:facilityId/stats', async (req, res) => {
  try {
    const stats = await referralService.getFacilityStats(req.params.facilityId);
    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
