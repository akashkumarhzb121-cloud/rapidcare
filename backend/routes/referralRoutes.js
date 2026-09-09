const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const referralService = require('../services/referralService');

// All routes require authentication
router.use(authMiddleware);

// Create referral (CHW or Operator)
router.post('/', roleMiddleware(['community_health_worker', 'ambulance_operator']), async (req, res) => {
  try {
    const result = await referralService.createReferral(req.body, req.userId);
    
    res.status(201).json({
      message: result.incident ? 'Emergency incident created from referral' : 'Referral created successfully',
      referral: result.referral,
      incident: result.incident,
      aiResponse: result.aiResponse
    });
  } catch (error) {
    console.error('Referral creation error:', error);
    res.status(500).json({ error: 'Failed to create referral: ' + error.message });
  }
});

// Update referral status
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
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`facility_${referral.toFacilityId}`).emit('referralStatusChanged', { referral });
    io.to(`facility_${referral.fromFacilityId}`).emit('referralStatusChanged', { referral });
    
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

module.exports = router;
