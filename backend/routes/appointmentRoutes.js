const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const appointmentService = require('../services/appointmentService');

router.use(authMiddleware);

// Book appointment (CHW, Operator, Staff)
router.post('/', roleMiddleware(['community_health_worker', 'ambulance_operator', 'hospital_staff']), async (req, res) => {
  try {
    const appointment = await appointmentService.bookAppointment(req.body, req.userId);

    const io = req.app.get('io');
    io.to(`facility_${appointment.facilityId._id}`).emit('appointmentBooked', {
      appointment
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get facility appointments (with optional date filter)
router.get('/facility/:facilityId', async (req, res) => {
  try {
    const { date, status } = req.query;
    const statusList = status ? status.split(',') : null;
    const appointments = await appointmentService.getFacilityAppointments(
      req.params.facilityId,
      date,
      statusList
    );
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Today's stats
router.get('/facility/:facilityId/stats', async (req, res) => {
  try {
    const stats = await appointmentService.getTodayStats(req.params.facilityId);
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Available slots for a date
router.get('/facility/:facilityId/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'date required (YYYY-MM-DD)' });
    const slots = await appointmentService.getAvailableSlots(req.params.facilityId, date);
    res.json({ slots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CHW's upcoming appointments
router.get('/my-upcoming', roleMiddleware(['community_health_worker']), async (req, res) => {
  try {
    const appointments = await appointmentService.getUpcomingForCHW(req.userId);
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update status
router.patch('/:id/status', roleMiddleware(['hospital_staff']), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const appointment = await appointmentService.updateStatus(req.params.id, status, req.userId, notes);

    const io = req.app.get('io');
    io.to(`facility_${appointment.facilityId}`).emit('appointmentUpdated', { appointment });

    res.json({ message: 'Status updated', appointment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const appointment = await appointmentService.cancelAppointment(req.params.id, req.userId, reason);

    const io = req.app.get('io');
    io.to(`facility_${appointment.facilityId}`).emit('appointmentUpdated', { appointment });

    res.json({ message: 'Appointment cancelled', appointment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
