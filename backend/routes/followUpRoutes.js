const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const followUpService = require('../services/followUpService');

router.use(authMiddleware);

// Get due follow-ups
router.get('/due', async (req, res) => {
  try {
    const followUps = await followUpService.getDueFollowUps(req.userId, req.userRole);
    res.json({ followUps });
  } catch (error) {
    console.error('Get due follow-ups error:', error);
    res.status(500).json({ error: 'Failed to get follow-ups' });
  }
});

// Get ALL follow-ups (including future)
router.get('/all', async (req, res) => {
  try {
    const followUps = await followUpService.getAllFollowUps(req.userId);
    res.json({ followUps });
  } catch (error) {
    console.error('Get all follow-ups error:', error);
    res.status(500).json({ error: 'Failed to get follow-ups' });
  }
});

// Complete follow-up
router.patch('/:id/complete', async (req, res) => {
  try {
    const { notes } = req.body;
    const followUp = await followUpService.completeFollowUp(req.params.id, req.userId, notes);
    res.json({ message: 'Follow-up completed', followUp });
  } catch (error) {
    console.error('Complete follow-up error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
