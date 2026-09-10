const FollowUpSchedule = require('../models/FollowUpSchedule');

async function createFollowUp(data, userId) {
  const followUp = new FollowUpSchedule({
    ...data,
    assignedTo: data.assignedTo || userId,
    status: 'scheduled'
  });
  
  await followUp.save();
  return followUp;
}

async function getDueFollowUps(userId = null, role = null) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const query = {
    dueDate: { $lte: today },
    status: 'scheduled'
  };
  
  if (role === 'community_health_worker' && userId) {
    query.assignedTo = userId;
  }
  
  return await FollowUpSchedule.find(query)
    .populate('patientId', 'name age village phone')
    .populate('assignedTo', 'name email')
    .populate('referralId', 'reason severity status')
    .sort('dueDate');
}

// Get ALL follow-ups for a CHW (including future ones)
async function getAllFollowUps(userId) {
  return await FollowUpSchedule.find({ assignedTo: userId })
    .populate('patientId', 'name age village phone')
    .populate('referralId', 'reason severity status referralType')
    .sort('-createdAt');
}

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

module.exports = { 
  createFollowUp, 
  getDueFollowUps, 
  getAllFollowUps,
  completeFollowUp, 
  schedulePostReferralFollowUp 
};
