const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');

// Create a new help request
async function createHelpRequest(data) {
  const { patientName, patientPhone, patientVillage, patientDistrict, issue, urgency, targetRole, targetFacilityId, location } = data;

  if (!patientName || !patientPhone || !issue || !targetRole) {
    throw new Error('Name, phone, issue, and target role are required');
  }

  const request = new HelpRequest({
    patientName,
    patientPhone,
    patientVillage,
    patientDistrict,
    issue,
    urgency,
    targetRole,
    targetFacilityId: targetFacilityId || null,
    location: location || {}
  });

  await request.save();
  return request;
}

// Get pending requests (filtered by role)
async function getPendingForRole(role, userFacilityId = null) {
  const query = { status: 'pending' };
  if (role === 'ambulance_operator') {
    query.targetRole = { $in: ['ambulance_operator', 'any'] };
  } else if (role === 'hospital_staff') {
    // Staff sees only requests for their facility, plus "any"
    query.$or = [
      { targetRole: 'any' },
      { targetRole: 'hospital_staff', targetFacilityId: userFacilityId },
      { targetRole: 'hospital_staff', targetFacilityId: null }
    ];
  } else if (role === 'community_health_worker') {
    query.targetRole = { $in: ['community_health_worker', 'any'] };
  }

  return HelpRequest.find(query)
    .populate('targetFacilityId', 'name district')
    .sort({ urgency: -1, createdAt: 1 })
    .limit(50);
}

// Get all requests (for admin)
async function getAllRequests(status = null) {
  const query = status ? { status } : {};
  return HelpRequest.find(query)
    .populate('claimedBy', 'name role')
    .populate('targetFacilityId', 'name district')
    .sort('-createdAt')
    .limit(200);
}

// Claim a request (atomic — prevents double-claim)
async function claimRequest(requestId, userId) {
  const request = await HelpRequest.findById(requestId);
  if (!request) throw new Error('Request not found');
  if (request.status !== 'pending') throw new Error('Request already ' + request.status);

  request.status = 'claimed';
  request.claimedBy = userId;
  request.claimedAt = new Date();
  await request.save();

  return await HelpRequest.findById(request._id)
    .populate('claimedBy', 'name role email')
    .populate('targetFacilityId', 'name district');
}

// Resolve a request
async function resolveRequest(requestId, userId, notes = '') {
  const request = await HelpRequest.findById(requestId);
  if (!request) throw new Error('Request not found');

  if (request.claimedBy?.toString() !== userId.toString()) {
    throw new Error('Only the person who claimed this request can resolve it');
  }

  request.status = 'resolved';
  request.resolvedAt = new Date();
  if (notes) request.resolutionNotes = notes;
  await request.save();

  return request;
}

// Cancel (by patient or admin)
async function cancelRequest(requestId) {
  const request = await HelpRequest.findById(requestId);
  if (!request) throw new Error('Request not found');

  request.status = 'cancelled';
  await request.save();
  return request;
}

// Get counts by role for dashboard badges
async function getPendingCounts() {
  const [operators, staff, chws, anyRole] = await Promise.all([
    HelpRequest.countDocuments({ status: 'pending', targetRole: 'ambulance_operator' }),
    HelpRequest.countDocuments({ status: 'pending', targetRole: 'hospital_staff' }),
    HelpRequest.countDocuments({ status: 'pending', targetRole: 'community_health_worker' }),
    HelpRequest.countDocuments({ status: 'pending', targetRole: 'any' })
  ]);

  return {
    ambulance_operator: operators + anyRole,
    hospital_staff: staff + anyRole,
    community_health_worker: chws + anyRole,
    any: anyRole
  };
}

// Get requests claimed by a specific user
async function getMyClaims(userId) {
  return HelpRequest.find({ claimedBy: userId, status: 'claimed' })
    .populate('targetFacilityId', 'name district')
    .sort('-claimedAt');
}

module.exports = {
  createHelpRequest,
  getPendingForRole,
  getAllRequests,
  claimRequest,
  resolveRequest,
  cancelRequest,
  getPendingCounts,
  getMyClaims
};
