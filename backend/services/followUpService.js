const FollowUpSchedule = require('../models/FollowUpSchedule');

// Create follow-up
async function createFollowUp(data, userId) {
  const followUp = new FollowUpSchedule({
    ...data,
    assignedTo: data.assignedTo || userId,
    status: 'scheduled'
  });
  
  await followUp.save();
  return followUp;
}

// Get due follow-ups
async function getDueFollowUps(userId = null, role = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const query = {
    dueDate: { $lte: today },
    status: 'scheduled'
  };
  
  // CHW sees only their assigned follow-ups
  if (role === 'community_health_worker' && userId) {
    query.assignedTo = userId;
  }
  
  return await FollowUpSchedule.find(query)
    .populate('patientId', 'name age village phone')
    .populate('assignedTo', 'name email')
    .sort('dueDate');
}

// Complete follow-up
async function completeFollowUp(followUpId, userId, notes = '') {
  const followUp = await FollowUpSchedule.findById(followUpId);
  if (!followUp) {
    throw new Error('Follow-up not found');
  }
  
  followUp.status = 'completed';
  followUp.completedDate = new Date();
  followUp.completedBy = userId;
  if (notes) followUp.notes = notes;
  
  await followUp.save();
  return followUp;
}

// Schedule post-referral follow-up
async function schedulePostReferralFollowUp(patientId, referralId, condition, dueDate, assignedTo) {
  return await createFollowUp({
    patientId,
    referralId,
    condition,
    scheduleType: 'post-referral',
    dueDate,
    assignedTo,
    priority: 'high'
  }, assignedTo);
}

module.exports = { createFollowUp, getDueFollowUps, completeFollowUp, schedulePostReferralFollowUp };
