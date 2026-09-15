const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const teleconsultService = require('../services/teleconsultService');

router.use(authMiddleware);

// NEW: List all specialists (CHW chooses from this)
router.get('/specialists', async (req, res) => {
  try {
    const specialists = await teleconsultService.getSpecialists(req.query.specialization);
    res.json({ specialists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CHW requests teleconsult
router.post('/', roleMiddleware(['community_health_worker', 'ambulance_operator']), async (req, res) => {
  try {
    const result = await teleconsultService.requestTeleconsult(req.body, req.userId);

    const io = req.app.get('io');

    // If pre-assigned to a specific doctor, notify only them
    if (result.targetDoctor) {
      io.to(`user_${result.targetDoctor._id}`).emit('newTeleconsultRequest', {
        consult: result.teleconsult,
        patient: result.teleconsult.patientId,
        preAssigned: true
      });
    } else {
      // Broadcast to matching specialists
      io.emit('newTeleconsultRequest', {
        consult: result.teleconsult,
        patient: result.teleconsult.patientId
      });
    }

    res.status(201).json({
      message: 'Teleconsultation requested',
      teleconsult: result.teleconsult,
      roomUrl: result.roomUrl,
      aiResult: result.aiResult,
      targetDoctor: result.targetDoctor
    });
  } catch (error) {
    console.error('Request teleconsult error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Specialists list pending requests
router.get('/pending', roleMiddleware(['specialist']), async (req, res) => {
  try {
    const specialization = req.user.specialization || null;
    const pending = await teleconsultService.getPendingRequests(specialization, req.userId);
    res.json({ pending });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Doctor's own consults
router.get('/my-consults', roleMiddleware(['specialist']), async (req, res) => {
  try {
    const consults = await teleconsultService.getMyConsults(req.userId, req.query.status);
    res.json({ consults });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CHW's requested consults
router.get('/my-requests', roleMiddleware(['community_health_worker']), async (req, res) => {
  try {
    const consults = await teleconsultService.getMyRequestedConsults(req.userId);
    res.json({ consults });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Doctor accepts
router.patch('/:id/accept', roleMiddleware(['specialist']), async (req, res) => {
  try {
    const consult = await teleconsultService.acceptConsult(req.params.id, req.userId);

    const io = req.app.get('io');
    io.to(`user_${consult.chwId}`).emit('teleconsultAccepted', {
      consultId: consult._id,
      doctorId: consult.doctorId
    });

    res.json({ message: 'Consultation accepted', consult });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// NEW: Doctor rejects
router.patch('/:id/reject', roleMiddleware(['specialist']), async (req, res) => {
  try {
    const { reason } = req.body;
    const consult = await teleconsultService.rejectConsult(req.params.id, req.userId, reason);

    const io = req.app.get('io');
    io.to(`user_${consult.chwId}`).emit('teleconsultRejected', {
      consultId: consult._id,
      reason: consult.notes
    });

    res.json({ message: 'Consultation rejected', consult });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Doctor starts
router.patch('/:id/start', roleMiddleware(['specialist']), async (req, res) => {
  try {
    const consult = await teleconsultService.startConsult(req.params.id, req.userId);

    const io = req.app.get('io');
    io.to(`user_${consult.chwId}`).emit('teleconsultStarted', { consultId: consult._id });

    res.json({ message: 'Consultation started', consult });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Doctor completes
router.patch('/:id/complete', roleMiddleware(['specialist']), async (req, res) => {
  try {
    const { consult, followUp } = await teleconsultService.completeConsult(
      req.params.id, req.userId, req.body
    );

    const io = req.app.get('io');
    io.to(`user_${consult.chwId}`).emit('teleconsultCompleted', {
      consultId: consult._id,
      prescription: consult.prescription,
      diagnosis: consult.diagnosis
    });

    res.json({ message: 'Consultation completed', consult, followUp });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel
router.patch('/:id/cancel', async (req, res) => {
  try {
    const consult = await teleconsultService.cancelConsult(req.params.id, req.userId);
    res.json({ message: 'Cancelled', consult });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single consult
router.get('/:id', async (req, res) => {
  try {
    const Teleconsultation = require('../models/Teleconsultation');
    const consult = await Teleconsultation.findById(req.params.id)
      .populate('patientId', 'name age gender village district phone chronicConditions highRiskFlags')
      .populate('chwId', 'name email')
      .populate('doctorId', 'name email specialization');

    if (!consult) return res.status(404).json({ error: 'Not found' });

    res.json({
      consult,
      roomUrl: `https://meet.jit.si/${consult.roomId}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
