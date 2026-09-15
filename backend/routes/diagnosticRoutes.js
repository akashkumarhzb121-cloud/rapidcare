const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const diagnosticService = require('../services/diagnosticService');

router.use(authMiddleware);

// Test catalog (public for authenticated users)
router.get('/catalog', (req, res) => {
  res.json({ catalog: diagnosticService.getTestCatalog() });
});

// Create order (CHW, Operator, Staff)
router.post('/', roleMiddleware(['community_health_worker', 'ambulance_operator', 'hospital_staff']), async (req, res) => {
  try {
    const order = await diagnosticService.createOrder(req.body, req.userId);

    const io = req.app.get('io');
    // Notify facility staff
    io.to(`facility_${order.facilityId._id}`).emit('newDiagnosticOrder', {
      order
    });
    // Notify CHW if different
    if (order.orderedBy._id.toString() !== req.userId.toString()) {
      io.to(`user_${order.orderedBy._id}`).emit('diagnosticOrderCreated', { order });
    }

    res.status(201).json({
      message: 'Diagnostic order created successfully',
      order
    });
  } catch (error) {
    console.error('Create diagnostic order error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Facility orders
router.get('/facility/:facilityId', async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await diagnosticService.getFacilityOrders(req.params.facilityId, status);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Facility stats
router.get('/facility/:facilityId/stats', async (req, res) => {
  try {
    const stats = await diagnosticService.getFacilityStats(req.params.facilityId);
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CHW's own orders
router.get('/my-orders', roleMiddleware(['community_health_worker']), async (req, res) => {
  try {
    const orders = await diagnosticService.getMyOrders(req.userId);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Patient's orders
router.get('/patient/:patientId', async (req, res) => {
  try {
    const orders = await diagnosticService.getPatientOrders(req.params.patientId);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update status (staff)
router.patch('/:id/status', roleMiddleware(['hospital_staff']), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await diagnosticService.updateOrderStatus(req.params.id, status, req.userId, notes);

    const io = req.app.get('io');
    io.to(`facility_${order.facilityId}`).emit('diagnosticOrderUpdated', { order });
    io.to(`user_${order.orderedBy}`).emit('diagnosticOrderUpdated', { order });

    res.json({ message: `Order status: ${status}`, order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Upload report (staff)
router.patch('/:id/upload-report', roleMiddleware(['hospital_staff']), async (req, res) => {
  try {
    const { testIndex, reportUrl, reportNotes } = req.body;
    if (testIndex === undefined) {
      return res.status(400).json({ error: 'testIndex required' });
    }
    if (!reportUrl) {
      return res.status(400).json({ error: 'reportUrl required' });
    }

    const order = await diagnosticService.uploadReport(
      req.params.id, testIndex, reportUrl, reportNotes, req.userId
    );

    const io = req.app.get('io');
    io.to(`facility_${order.facilityId}`).emit('diagnosticOrderUpdated', { order });
    io.to(`user_${order.orderedBy}`).emit('diagnosticReportReady', {
      order,
      reportUrl,
      testName: order.tests[testIndex]?.name
    });

    res.json({ message: 'Report uploaded', order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await diagnosticService.cancelOrder(req.params.id, req.userId, reason);

    const io = req.app.get('io');
    io.to(`facility_${order.facilityId}`).emit('diagnosticOrderUpdated', { order });
    io.to(`user_${order.orderedBy}`).emit('diagnosticOrderUpdated', { order });

    res.json({ message: 'Order cancelled', order });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const DiagnosticOrder = require('../models/DiagnosticOrder');
    const order = await DiagnosticOrder.findById(req.params.id)
      .populate('patientId', 'name age gender village district phone')
      .populate('facilityId', 'name district facilityType address')
      .populate('orderedBy', 'name email')
      .populate('processedBy', 'name');

    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
