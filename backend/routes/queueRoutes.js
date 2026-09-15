const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const queueService = require('../services/queueService');

router.use(authMiddleware);

// Add patient to queue (CHW or Operator)
router.post('/', roleMiddleware(['community_health_worker', 'ambulance_operator', 'hospital_staff']), async (req, res) => {
  try {
    const entry = await queueService.addToQueue(req.body, req.userId);
    const populated = await entry.populate('patientId', 'name age gender village');

    const io = req.app.get('io');
    io.to(`facility_${entry.facilityId}`).emit('queueUpdated', {
      action: 'added',
      facilityId: entry.facilityId,
      entry: populated
    });

    res.status(201).json({
      message: `Added to queue — Token #${entry.tokenNumber}`,
      entry: populated
    });
  } catch (error) {
    console.error('Add to queue error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get queue for a facility
router.get('/facility/:facilityId', async (req, res) => {
  try {
    const { includeCompleted } = req.query;
    const result = await queueService.getFacilityQueue(
      req.params.facilityId,
      includeCompleted === 'true'
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Staff calls next
router.patch('/facility/:facilityId/call-next', roleMiddleware(['hospital_staff']), async (req, res) => {
  try {
    const entry = await queueService.callNext(req.params.facilityId, req.userId);

    const io = req.app.get('io');
    io.to(`facility_${req.params.facilityId}`).emit('queueUpdated', {
      action: 'called',
      facilityId: req.params.facilityId,
      entry
    });

    res.json({ message: `Now calling Token #${entry.tokenNumber}`, entry });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update queue status
router.patch('/:id/status', roleMiddleware(['hospital_staff']), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const entry = await queueService.updateStatus(req.params.id, status, req.userId, notes);

    const io = req.app.get('io');
    io.to(`facility_${entry.facilityId}`).emit('queueUpdated', {
      action: 'status-changed',
      facilityId: entry.facilityId,
      entry
    });

    res.json({ message: `Status updated to ${status}`, entry });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Skip patient
router.patch('/:id/skip', roleMiddleware(['hospital_staff']), async (req, res) => {
  try {
    const entry = await queueService.skipPatient(req.params.id);

    const io = req.app.get('io');
    io.to(`facility_${entry.facilityId}`).emit('queueUpdated', {
      action: 'skipped',
      facilityId: entry.facilityId,
      entry
    });

    res.json({ message: 'Patient skipped', entry });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Patient's queue status
router.get('/patient/all', async (req, res) => {
  try {
    const entries = await queueService.getQueueForCHW(req.userId);
    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/patient/:patientId', async (req, res) => {
  try {
    const entries = await queueService.getPatientQueueStatus(req.params.patientId);
    res.json({ entries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
