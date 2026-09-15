const Queue = require('../models/Queue');
const Facility = require('../models/Facility');
const Patient = require('../models/Patient');

const AVG_CONSULT_MINUTES = 10;

// Add patient to queue
async function addToQueue(data, userId) {
  const { facilityId, patientId, priority = 'normal', reason = '' } = data;

  const facility = await Facility.findById(facilityId);
  if (!facility) throw new Error('Facility not found');

  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error('Patient not found');

  // Check if patient is already in queue
  const existing = await Queue.findOne({
    facilityId,
    patientId,
    status: { $in: ['waiting', 'called', 'in-consultation'] }
  });
  if (existing) {
    throw new Error(`Patient already in queue (Token #${existing.tokenNumber})`);
  }

  const queueEntry = new Queue({
    facilityId,
    patientId,
    addedBy: userId,
    priority,
    reason
  });

  await queueEntry.save();
  return queueEntry;
}

// Get queue for a facility (today's active)
async function getFacilityQueue(facilityId, includeCompleted = false) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const query = {
    facilityId,
    joinedAt: { $gte: today }
  };

  if (!includeCompleted) {
    query.status = { $in: ['waiting', 'called', 'in-consultation'] };
  }

  const entries = await Queue.find(query)
    .populate('patientId', 'name age gender village phone highRiskFlags chronicConditions')
    .populate('addedBy', 'name')
    .sort({ priority: -1, joinedAt: 1 })
    .lean();

  // Sort by priority (emergency > high > normal), then by join time
  const priorityOrder = { emergency: 0, high: 1, normal: 2 };
  entries.sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });

  // Calculate wait times for waiting entries
  const inProgress = entries.filter(e => ['called', 'in-consultation'].includes(e.status));
  const waiting = entries.filter(e => e.status === 'waiting');

  // Position in queue + estimated wait
  const enriched = entries.map((entry, idx) => {
    const positionAhead = waiting.slice(0, waiting.findIndex(w => w._id.toString() === entry._id.toString())).length;
    const estimatedWaitMinutes = entry.status === 'waiting'
      ? Math.max(0, positionAhead * AVG_CONSULT_MINUTES)
      : 0;

    return {
      ...entry,
      position: entry.status === 'waiting' ? positionAhead + 1 : null,
      estimatedWaitMinutes
    };
  });

  return {
    entries: enriched,
    stats: {
      totalWaiting: waiting.length,
      inProgress: inProgress.length,
      avgConsultMinutes: AVG_CONSULT_MINUTES,
      estClearTime: new Date(Date.now() + waiting.length * AVG_CONSULT_MINUTES * 60000)
    }
  };
}

// Staff calls next patient (highest priority + earliest)
async function callNext(facilityId, userId) {
  // End any current in-consultation first? No — staff may want to skip. Just find next.
  const next = await Queue.findOne({
    facilityId,
    status: 'waiting'
  })
    .sort({ priority: -1, joinedAt: 1 })
    .populate('patientId', 'name age gender village');

  if (!next) throw new Error('No patients waiting in queue');

  // Sort priority properly
  const allWaiting = await Queue.find({ facilityId, status: 'waiting' })
    .sort({ joinedAt: 1 })
    .populate('patientId', 'name age');

  const priorityOrder = { emergency: 0, high: 1, normal: 2 };
  allWaiting.sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });

  const chosen = allWaiting[0];
  chosen.status = 'called';
  chosen.calledAt = new Date();
  await chosen.save();

  return await Queue.findById(chosen._id)
    .populate('patientId', 'name age gender village phone');
}

// Update status
async function updateStatus(queueId, status, userId, notes = '') {
  const entry = await Queue.findById(queueId);
  if (!entry) throw new Error('Queue entry not found');

  entry.status = status;
  if (status === 'in-consultation') entry.consultStartedAt = new Date();
  if (status === 'done') entry.completedAt = new Date();
  if (notes) entry.notes = notes;

  await entry.save();
  return entry;
}

// Skip a patient (called but not present)
async function skipPatient(queueId) {
  const entry = await Queue.findById(queueId);
  if (!entry) throw new Error('Queue entry not found');
  entry.status = 'skipped';
  await entry.save();
  return entry;
}

// Get patient's queue status across all facilities
async function getPatientQueueStatus(patientId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Queue.find({
    patientId,
    joinedAt: { $gte: today },
    status: { $in: ['waiting', 'called', 'in-consultation'] }
  })
    .populate('facilityId', 'name district address contactNumber')
    .lean();
}

async function getQueueForCHW(chwId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Queue.find({
    addedBy: chwId,
    joinedAt: { $gte: today },
    status: { $in: ['waiting', 'called', 'in-consultation'] }
  })
    .populate('patientId', 'name age gender village phone')
    .populate('facilityId', 'name district')
    .sort({ joinedAt: 1 })
    .lean();
}

module.exports = {
  addToQueue,
  getFacilityQueue,
  callNext,
  updateStatus,
  skipPatient,
  getPatientQueueStatus,
  getQueueForCHW
};
