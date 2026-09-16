const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const helpRequestService = require('../services/helpRequestService');

// PUBLIC — no auth required. Patient can request help.
router.post('/', async (req, res) => {
  try {
    const request = await helpRequestService.createHelpRequest(req.body);

    // Broadcast to matching users
    const io = req.app.get('io');
    io.emit('newHelpRequest', { request });

    // Targeted notifications
    if (request.targetRole === 'hospital_staff' && request.targetFacilityId) {
      io.to(`facility_${request.targetFacilityId}`).emit('newHelpRequest', { request });
    } else if (request.targetRole === 'ambulance_operator') {
      io.emit('newHelpRequest', { request, forRole: 'ambulance_operator' });
    } else if (request.targetRole === 'community_health_worker') {
      io.emit('newHelpRequest', { request, forRole: 'community_health_worker' });
    }

    // Also send to admin room
    io.emit('newHelpRequestAdmin', { request });

    res.status(201).json({
      message: '✅ Help request sent. Someone will reach out to you shortly.',
      request: {
        _id: request._id,
        status: request.status,
        targetRole: request.targetRole
      }
    });
  } catch (error) {
    console.error('Help request error:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUBLIC — check status of a request by ID (patient refreshes page)
router.get('/status/:id', async (req, res) => {
  try {
    const HelpRequest = require('../models/HelpRequest');
    const request = await HelpRequest.findById(req.params.id)
      .populate('claimedBy', 'name role')
      .select('status targetRole urgency patientName createdAt claimedAt claimedBy resolvedAt resolutionNotes');

    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Everything below requires auth
router.use(authMiddleware);

// Get pending requests for current user's role
router.get('/pending', async (req, res) => {
  try {
    const userFacilityId = req.user.linkedFacilityId || req.user.linkedHospitalId;
    const requests = await helpRequestService.getPendingForRole(req.userRole, userFacilityId);
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get my claimed requests
router.get('/my-claims', async (req, res) => {
  try {
    const requests = await helpRequestService.getMyClaims(req.userId);
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get counts for badge
router.get('/counts', async (req, res) => {
  try {
    const counts = await helpRequestService.getPendingCounts();
    res.json({ counts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin can see everything
router.get('/all', roleMiddleware(['district_admin']), async (req, res) => {
  try {
    const requests = await helpRequestService.getAllRequests(req.query.status);
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Claim a request
router.patch('/:id/claim', async (req, res) => {
  try {
    const request = await helpRequestService.claimRequest(req.params.id, req.userId);

    const io = req.app.get('io');
    // Tell everyone this request is taken
    io.emit('helpRequestClaimed', {
      requestId: request._id,
      claimedBy: { name: request.claimedBy.name, role: request.claimedBy.role },
      claimedById: request.claimedBy._id
    });

    res.json({ message: '✅ You have claimed this request. Please call the patient.', request });
  } catch (error) {
    console.error('Claim error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Resolve a request
router.patch('/:id/resolve', async (req, res) => {
  try {
    const { notes } = req.body;
    const request = await helpRequestService.resolveRequest(req.params.id, req.userId, notes);

    const io = req.app.get('io');
    io.emit('helpRequestResolved', { requestId: request._id });

    res.json({ message: '✅ Request marked as resolved', request });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel
router.patch('/:id/cancel', async (req, res) => {
  try {
    const request = await helpRequestService.cancelRequest(req.params.id);

    const io = req.app.get('io');
    io.emit('helpRequestCancelled', { requestId: request._id });

    res.json({ message: 'Request cancelled', request });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
