const DiagnosticOrder = require('../models/DiagnosticOrder');
const Facility = require('../models/Facility');
const Patient = require('../models/Patient');

// Test catalog with default expected turnaround (hours)
const TEST_CATALOG = {
  'Blood Test': { category: 'blood', hours: 4 },
  'Complete Blood Count (CBC)': { category: 'blood', hours: 4 },
  'Blood Sugar (Fasting)': { category: 'blood', hours: 2 },
  'HbA1c': { category: 'blood', hours: 24 },
  'Lipid Profile': { category: 'blood', hours: 6 },
  'Liver Function Test (LFT)': { category: 'blood', hours: 6 },
  'Kidney Function Test (KFT)': { category: 'blood', hours: 6 },
  'Thyroid Profile': { category: 'blood', hours: 24 },
  'Urine Analysis': { category: 'urine', hours: 3 },
  'Urine Culture': { category: 'urine', hours: 48 },
  'X-Ray': { category: 'imaging', hours: 2 },
  'CT Scan': { category: 'imaging', hours: 6 },
  'MRI': { category: 'imaging', hours: 12 },
  'Ultrasound': { category: 'imaging', hours: 3 },
  'ECG': { category: 'cardiac', hours: 1 },
  'Echocardiography': { category: 'cardiac', hours: 6 },
  'Treadmill Test (TMT)': { category: 'cardiac', hours: 8 },
  'Pregnancy Test': { category: 'urine', hours: 1 },
  'COVID-19 RT-PCR': { category: 'other', hours: 24 },
  'Malaria Test': { category: 'blood', hours: 2 },
  'Dengue Test': { category: 'blood', hours: 4 },
  'Typhoid Test': { category: 'blood', hours: 6 },
};

// Create a new diagnostic order
async function createOrder(data, userId) {
  const { patientId, facilityId, tests, reason, clinicalNotes = '', priority = 'normal' } = data;

  const facility = await Facility.findById(facilityId);
  if (!facility) throw new Error('Facility not found');

  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error('Patient not found');

  if (!Array.isArray(tests) || tests.length === 0) {
    throw new Error('At least one test is required');
  }

  // Enrich tests with category from catalog
  const enrichedTests = tests.map(t => {
    const testName = typeof t === 'string' ? t : t.name;
    const catalogEntry = TEST_CATALOG[testName];
    return {
      name: testName,
      category: catalogEntry?.category || 'other',
      status: 'ordered'
    };
  });

  // Calculate expected ready time (max of all test hours)
  const maxHours = Math.max(
    ...enrichedTests.map(t => TEST_CATALOG[t.name]?.hours || 4)
  );
  const expectedReadyBy = new Date(Date.now() + maxHours * 60 * 60 * 1000);

  const order = new DiagnosticOrder({
    patientId,
    facilityId,
    orderedBy: userId,
    tests: enrichedTests,
    reason,
    clinicalNotes,
    priority,
    expectedReadyBy
  });

  await order.save();

  return await DiagnosticOrder.findById(order._id)
    .populate('patientId', 'name age gender village district phone')
    .populate('facilityId', 'name district facilityType')
    .populate('orderedBy', 'name');
}

// Get orders for a facility (staff view)
async function getFacilityOrders(facilityId, status = null) {
  const query = { facilityId };
  if (status) query.status = status;

  return DiagnosticOrder.find(query)
    .populate('patientId', 'name age gender village phone')
    .populate('orderedBy', 'name')
    .populate('processedBy', 'name')
    .sort('-orderedAt');
}

// Get orders for a patient (CHW view)
async function getPatientOrders(patientId) {
  return DiagnosticOrder.find({ patientId })
    .populate('facilityId', 'name district')
    .populate('orderedBy', 'name')
    .populate('processedBy', 'name')
    .sort('-orderedAt');
}

// Get orders created by a CHW
async function getMyOrders(chwId) {
  return DiagnosticOrder.find({ orderedBy: chwId })
    .populate('patientId', 'name age village')
    .populate('facilityId', 'name district')
    .sort('-orderedAt');
}

// Staff updates order status
async function updateOrderStatus(orderId, newStatus, userId, notes = '') {
  const order = await DiagnosticOrder.findById(orderId);
  if (!order) throw new Error('Order not found');

  order.status = newStatus;
  order.processedBy = userId;

  const now = new Date();
  if (newStatus === 'sample-collected') order.sampleCollectedAt = now;
  if (newStatus === 'in-progress') order.inProgressAt = now;
  if (newStatus === 'ready') order.readyAt = now;
  if (newStatus === 'delivered') order.deliveredAt = now;
  if (notes) order.clinicalNotes = notes;

  // Sync individual test statuses
  order.tests.forEach(t => {
    if (t.status === 'ordered' && newStatus !== 'ordered') {
      t.status = newStatus === 'ready' || newStatus === 'delivered' ? 'ready' : newStatus;
    }
  });

  await order.save();
  return order;
}

// Staff uploads report for a specific test (or all)
async function uploadReport(orderId, testIndex, reportUrl, reportNotes, userId) {
  const order = await DiagnosticOrder.findById(orderId);
  if (!order) throw new Error('Order not found');

  const test = order.tests[testIndex];
  if (!test) throw new Error('Test not found');

  test.reportUrl = reportUrl;
  test.reportNotes = reportNotes || '';
  test.status = 'ready';
  test.completedAt = new Date();

  // If all tests are ready, mark order as ready
  const allReady = order.tests.every(t => t.status === 'ready');
  if (allReady) {
    order.status = 'ready';
    order.readyAt = new Date();
  } else {
    order.status = 'in-progress';
  }

  order.processedBy = userId;
  await order.save();

  return order;
}

// Cancel order
async function cancelOrder(orderId, userId, reason = '') {
  const order = await DiagnosticOrder.findById(orderId);
  if (!order) throw new Error('Order not found');

  if (['ready', 'delivered'].includes(order.status)) {
    throw new Error('Cannot cancel a completed order');
  }

  order.status = 'cancelled';
  order.clinicalNotes = reason ? `${order.clinicalNotes} [Cancelled: ${reason}]` : order.clinicalNotes;
  order.processedBy = userId;

  await order.save();
  return order;
}

// Get test catalog (for frontend dropdowns)
function getTestCatalog() {
  return Object.entries(TEST_CATALOG).map(([name, meta]) => ({
    name,
    category: meta.category,
    hours: meta.hours
  }));
}

// Stats for facility dashboard
async function getFacilityStats(facilityId) {
  const [pending, inProgress, ready, completedToday] = await Promise.all([
    DiagnosticOrder.countDocuments({ facilityId, status: 'ordered' }),
    DiagnosticOrder.countDocuments({ facilityId, status: { $in: ['sample-collected', 'in-progress'] } }),
    DiagnosticOrder.countDocuments({ facilityId, status: 'ready' }),
    DiagnosticOrder.countDocuments({
      facilityId,
      status: { $in: ['ready', 'delivered'] },
      readyAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    })
  ]);

  return { pending, inProgress, ready, completedToday };
}

module.exports = {
  createOrder,
  getFacilityOrders,
  getPatientOrders,
  getMyOrders,
  updateOrderStatus,
  uploadReport,
  cancelOrder,
  getTestCatalog,
  getFacilityStats
};
