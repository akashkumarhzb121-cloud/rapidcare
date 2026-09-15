const Teleconsultation = require('../models/Teleconsultation');
const Patient = require('../models/Patient');
const FollowUpSchedule = require('../models/FollowUpSchedule');
const User = require('../models/User');
const { analyzePatientCondition } = require('./aiService');

function generateRoomId() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  const suffix = Date.now().toString(36);
  return `rapidcare-${id}-${suffix}`;
}

// NEW: Get all available specialists for CHW to choose from
async function getSpecialists(specialization = null) {
  const query = {
    role: 'specialist',
    isAvailableForConsult: true,
  };
  if (specialization) {
    query.specialization = specialization;
  }

  const specialists = await User.find(query)
    .select('name email specialization languagePreference isAvailableForConsult linkedFacilityId')
    .populate('linkedFacilityId', 'name district')
    .sort('name');

  return specialists;
}

// UPDATED: Accept targetDoctorId (routing) + fallback to broadcast
async function requestTeleconsult(data, chwUserId) {
  const { patientId, symptoms, targetDoctorId } = data;

  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error('Patient not found');

  // AI triage on symptoms
  const aiResult = await analyzePatientCondition(symptoms);

  // Validate target doctor if provided
  let targetDoctor = null;
  if (targetDoctorId) {
    targetDoctor = await User.findById(targetDoctorId);
    if (!targetDoctor || targetDoctor.role !== 'specialist') {
      throw new Error('Invalid specialist selected');
    }
  }

  const teleconsult = new Teleconsultation({
    patientId,
    chwId: chwUserId,
    doctorId: targetDoctor ? targetDoctor._id : null,     // Pre-assigned if CHW chose
    roomId: generateRoomId(),
    symptoms,
    requiredSpecialization: aiResult.requiredSpecialization,
    aiSeverity: aiResult.severity,
    aiReasoning: aiResult.aiReasoning,
    status: 'requested',
    priority: aiResult.severity === 'critical' ? 'urgent' : aiResult.severity === 'moderate' ? 'high' : 'normal',
    requestedAt: new Date()
  });

  await teleconsult.save();

  return {
    teleconsult,
    roomUrl: `https://meet.jit.si/${teleconsult.roomId}`,
    aiResult,
    targetDoctor
  };
}

// UPDATED: Show consults to a specialist if either (a) pre-assigned to them, OR (b) unassigned
async function getPendingRequests(specialization = null, doctorId = null) {
  const baseQuery = { status: 'requested' };

  // A specialist sees:
  // 1. Requests directly assigned to them
  // 2. Requests with no doctor AND matching their specialization
  const query = doctorId
    ? {
        status: 'requested',
        $or: [
          { doctorId: doctorId },
          { doctorId: null, ...(specialization ? { requiredSpecialization: specialization } : {}) }
        ]
      }
    : baseQuery;

  return Teleconsultation.find(query)
    .populate('patientId', 'name age gender village district phone chronicConditions highRiskFlags')
    .populate('chwId', 'name email phone')
    .populate('doctorId', 'name email specialization')
    .sort({ priority: 1, requestedAt: 1 });
}

async function getMyConsults(doctorId, status = null) {
  const query = { doctorId };
  if (status) query.status = status;

  return Teleconsultation.find(query)
    .populate('patientId', 'name age gender village district phone')
    .populate('chwId', 'name email')
    .sort('-requestedAt');
}

async function getMyRequestedConsults(chwId) {
  return Teleconsultation.find({ chwId })
    .populate('patientId', 'name age gender village')
    .populate('doctorId', 'name specialization email')
    .sort('-requestedAt');
}

async function acceptConsult(consultId, doctorUserId) {
  const consult = await Teleconsultation.findById(consultId);
  if (!consult) throw new Error('Consultation not found');
  if (consult.status !== 'requested') throw new Error('Already accepted');

  // If pre-assigned to a different doctor, block
  if (consult.doctorId && consult.doctorId.toString() !== doctorUserId.toString()) {
    throw new Error('This consultation is assigned to another specialist');
  }

  consult.doctorId = doctorUserId;
  consult.status = 'accepted';
  consult.acceptedAt = new Date();
  await consult.save();

  return consult;
}

async function startConsult(consultId, doctorUserId) {
  const consult = await Teleconsultation.findById(consultId);
  if (!consult) throw new Error('Consultation not found');
  if (consult.doctorId?.toString() !== doctorUserId.toString()) {
    throw new Error('Not your consultation');
  }

  consult.status = 'active';
  consult.startedAt = new Date();
  await consult.save();

  return consult;
}

async function completeConsult(consultId, doctorUserId, data) {
  const consult = await Teleconsultation.findById(consultId);
  if (!consult) throw new Error('Consultation not found');
  if (consult.doctorId?.toString() !== doctorUserId.toString()) {
    throw new Error('Not your consultation');
  }
  if (!['accepted', 'active'].includes(consult.status)) {
    throw new Error('Consultation is not in a completable state');
  }
  if (!consult.startedAt) {
    consult.startedAt = new Date();
  }

  const { prescription, notes, diagnosis, followUpDays } = data;

  consult.status = 'completed';
  consult.endedAt = new Date();
  consult.prescription = prescription || '';
  consult.notes = notes || '';
  consult.diagnosis = diagnosis || '';
  consult.followUpDays = followUpDays || 0;

  if (consult.startedAt) {
    consult.durationMinutes = Math.round((consult.endedAt - consult.startedAt) / 60000);
  }

  await consult.save();

  let followUp = null;
  if (followUpDays > 0) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + followUpDays);

    followUp = new FollowUpSchedule({
      patientId: consult.patientId,
      condition: `Teleconsult follow-up: ${diagnosis || 'Consultation review'}`,
      scheduleType: 'post-referral',
      dueDate,
      status: 'scheduled',
      priority: consult.priority === 'urgent' ? 'high' : 'medium',
      assignedTo: consult.chwId,
      notes: `Auto-created from teleconsultation on ${new Date().toLocaleDateString()}`
    });
    await followUp.save();
  }

  return { consult, followUp };
}

async function cancelConsult(consultId, userId) {
  const consult = await Teleconsultation.findById(consultId);
  if (!consult) throw new Error('Consultation not found');

  const isOwner = consult.chwId?.toString() === userId.toString();
  const isDoctor = consult.doctorId?.toString() === userId.toString();

  if (!isOwner && !isDoctor) throw new Error('Not authorized');

  consult.status = 'cancelled';
  consult.endedAt = new Date();
  await consult.save();

  return consult;
}

// NEW: Reject (specialist declines)
async function rejectConsult(consultId, doctorUserId, reason = '') {
  const consult = await Teleconsultation.findById(consultId);
  if (!consult) throw new Error('Consultation not found');
  if (consult.status !== 'requested') throw new Error('Only pending requests can be rejected');

  consult.status = 'cancelled';
  consult.doctorId = doctorUserId;
  consult.notes = `Rejected: ${reason || 'No reason provided'}`;
  consult.endedAt = new Date();
  await consult.save();

  return consult;
}

module.exports = {
  requestTeleconsult,
  getSpecialists,
  getPendingRequests,
  getMyConsults,
  getMyRequestedConsults,
  acceptConsult,
  startConsult,
  completeConsult,
  cancelConsult,
  rejectConsult
};
