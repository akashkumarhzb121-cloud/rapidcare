const Referral = require('../models/Referral');
const Incident = require('../models/Incident');
const Facility = require('../models/Facility');
const FollowUpSchedule = require('../models/FollowUpSchedule');
const { analyzePatientCondition } = require('./aiService');
const { geocodeLocation } = require('./locationService');
const { rankHospitals } = require('./distanceService');

// Create referral with AI triage
async function createReferral(data, userId) {
  const {
    patientId,
    fromFacilityId,
    toFacilityId,
    patientDescription,
    patientLocation,
    forceEmergency = false
  } = data;
  
  console.log('=== Creating Referral ===');
  console.log('Patient:', patientId);
  console.log('Force Emergency:', forceEmergency);
  
  const fromFacility = await Facility.findById(fromFacilityId);
  
  let ambulanceLocation = {
    lat: fromFacility?.location?.lat || 0,
    lng: fromFacility?.location?.lng || 0,
    address: fromFacility?.address || '',
    displayName: fromFacility?.name || ''
  };
  
  if (typeof patientLocation === 'string' && patientLocation.trim()) {
    const geocoded = await geocodeLocation(patientLocation);
    if (geocoded) {
      ambulanceLocation = {
        lat: geocoded.lat,
        lng: geocoded.lng,
        address: formatAddress(geocoded.address),
        displayName: geocoded.displayName
      };
    }
  } else if (patientLocation && patientLocation.lat && patientLocation.lng) {
    ambulanceLocation = {
      lat: patientLocation.lat,
      lng: patientLocation.lng,
      address: patientLocation.address || '',
      displayName: patientLocation.displayName || ''
    };
  }
  
  // AI Triage
  const aiResponse = await analyzePatientCondition(patientDescription);
  console.log('AI Response:', aiResponse);
  
  // If forceEmergency is true, override severity to critical
  const effectiveSeverity = forceEmergency ? 'critical' : aiResponse.severity;
  const isEmergency = effectiveSeverity === 'critical';
  
  let referralType = 'routine';
  if (effectiveSeverity === 'critical') {
    referralType = 'emergency';
  } else if (effectiveSeverity === 'moderate') {
    referralType = 'urgent';
  }
  
  const referral = new Referral({
    patientId,
    fromFacilityId,
    toFacilityId,
    reason: patientDescription,
    aiReasoning: forceEmergency 
      ? 'Marked as emergency by health worker - ' + aiResponse.aiReasoning
      : aiResponse.aiReasoning,
    severity: effectiveSeverity,
    requiredSpecialization: aiResponse.requiredSpecialization,
    referralType,
    status: 'initiated',
    isEmergencyFlagged: forceEmergency,
    timeline: [{
      status: 'initiated',
      updatedBy: userId,
      facilityId: fromFacilityId,
      notes: forceEmergency ? '🚨 Emergency referral created' : 'Referral created'
    }],
    createdBy: userId
  });
  
  await referral.save();
  console.log('Referral created:', referral._id);
  
  // If critical OR emergency flagged, auto-create incident
  if (isEmergency) {
    console.log('Emergency case - creating incident');
    
    try {
      const incident = new Incident({
        patientDescription,
        severity: 'critical',
        requiredSpecialization: aiResponse.requiredSpecialization,
        aiReasoning: referral.aiReasoning,
        ambulanceLocation: {
          lat: ambulanceLocation.lat,
          lng: ambulanceLocation.lng,
          address: ambulanceLocation.address || '',
          displayName: ambulanceLocation.displayName || ''
        },
        patientLocation: typeof patientLocation === 'string' ? patientLocation : ambulanceLocation.displayName || '',
        patientId,
        linkedReferral: referral._id,
        createdBy: userId,
        status: 'pending'
      });
      
      await incident.save();
      console.log('Incident created:', incident._id);
      
      referral.linkedIncident = incident._id;
      await referral.save();
      
      // Find matching hospitals
      const matchingHospitals = await Facility.find({
        specializations: aiResponse.requiredSpecialization,
        availableBeds: { $gt: 0 },
        facilityType: 'district-hospital'
      });
      
      const rankedHospitals = matchingHospitals.length > 0
        ? rankHospitals(matchingHospitals, ambulanceLocation)
        : [];
      
      return { 
        referral, 
        incident, 
        aiResponse,
        isEmergency: true,
        matchedHospitals: rankedHospitals
      };
      
    } catch (error) {
      console.error('Error creating incident:', error);
      return { referral, incident: null, aiResponse, isEmergency: true, error: error.message };
    }
  }
  
  return { referral, incident: null, aiResponse, isEmergency: false };
}

// Update referral status - NOW CREATES FOLLOW-UP ON ACCEPTANCE
async function updateReferralStatus(referralId, newStatus, userId, facilityId, notes = '') {
  const referral = await Referral.findById(referralId);
  if (!referral) {
    throw new Error('Referral not found');
  }
  
  const previousStatus = referral.status;
  referral.status = newStatus;
  referral.timeline.push({
    status: newStatus,
    updatedBy: userId,
    facilityId,
    notes,
    timestamp: new Date()
  });
  
  await referral.save();
  
  // Create follow-up when referral is ACCEPTED (received)
  if (newStatus === 'received' && previousStatus === 'initiated') {
    await createFollowUpForReferral(referral, userId);
  }
  
  // Mark follow-up as completed when referral is completed
  if (newStatus === 'completed') {
    await completeFollowUpForReferral(referral, userId);
  }
  
  return referral;
}

// Create follow-up entry for accepted referral
async function createFollowUpForReferral(referral, staffUserId) {
  try {
    const patient = await require('../models/Patient').findById(referral.patientId);
    const facility = await Facility.findById(referral.fromFacilityId);
    
    // Find the original CHW who created the referral
    const chwUser = await require('../models/User').findById(referral.createdBy);
    
    // Calculate follow-up date (7 days from now by default)
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 7);
    
    // Determine schedule type based on referral
    let scheduleType = 'post-referral';
    if (patient?.highRiskFlags?.includes('pregnancy')) scheduleType = 'maternal';
    else if (patient?.highRiskFlags?.includes('child_under_5')) scheduleType = 'child';
    else if (patient?.chronicConditions?.length > 0) scheduleType = 'chronic';
    
    const followUp = new FollowUpSchedule({
      patientId: referral.patientId,
      referralId: referral._id,
      condition: `Referral Accepted - ${referral.reason.substring(0, 100)}`,
      scheduleType,
      dueDate: followUpDate,
      status: 'scheduled',
      priority: referral.severity === 'critical' ? 'high' : 
                referral.severity === 'moderate' ? 'medium' : 'low',
      assignedTo: chwUser?._id || staffUserId,
      notes: `Referral accepted by ${facility?.name || 'facility'} on ${new Date().toLocaleDateString()}. Follow-up required in 7 days.`
    });
    
    await followUp.save();
    console.log('Follow-up created for accepted referral:', followUp._id);
    
    return followUp;
  } catch (error) {
    console.error('Error creating follow-up:', error);
    return null;
  }
}

// Complete follow-up when referral is completed
async function completeFollowUpForReferral(referral, userId) {
  try {
    const followUps = await FollowUpSchedule.find({ 
      referralId: referral._id,
      status: 'scheduled'
    });
    
    for (const followUp of followUps) {
      followUp.status = 'completed';
      followUp.completedDate = new Date();
      followUp.completedBy = userId;
      followUp.notes = (followUp.notes || '') + ' [Referral completed]';
      await followUp.save();
    }
    
    console.log(`Completed ${followUps.length} follow-ups for referral ${referral._id}`);
  } catch (error) {
    console.error('Error completing follow-ups:', error);
  }
}

// Get facility referrals
async function getFacilityReferrals(facilityId, type = 'incoming') {
  const query = type === 'incoming' 
    ? { toFacilityId: facilityId }
    : { fromFacilityId: facilityId };
  
  return await Referral.find(query)
    .populate('patientId', 'name age village phone highRiskFlags chronicConditions')
    .populate('fromFacilityId', 'name facilityType')
    .populate('toFacilityId', 'name facilityType')
    .sort('-createdAt');
}

// Get facility referral stats for dashboard
async function getFacilityStats(facilityId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [
    totalIncoming,
    pendingReferrals,
    completedToday,
    emergencyCount,
    activeEmergencies
  ] = await Promise.all([
    Referral.countDocuments({ toFacilityId: facilityId }),
    Referral.countDocuments({ toFacilityId: facilityId, status: 'initiated' }),
    Referral.countDocuments({ 
      toFacilityId: facilityId, 
      status: { $in: ['received', 'completed'] },
      updatedAt: { $gte: today }
    }),
    Referral.countDocuments({ toFacilityId: facilityId, severity: 'critical' }),
    Incident.countDocuments({ 
      assignedHospitalId: facilityId, 
      status: 'dispatched' 
    })
  ]);
  
  return {
    totalIncoming,
    pendingReferrals,
    completedToday,
    emergencyCount,
    activeEmergencies
  };
}

function formatAddress(addressObj) {
  if (!addressObj) return '';
  if (typeof addressObj === 'string') return addressObj;
  const parts = [];
  const fields = ['road', 'suburb', 'city', 'town', 'village', 'state', 'postcode', 'country'];
  for (const f of fields) if (addressObj[f]) parts.push(addressObj[f]);
  return parts.join(', ') || 'Location provided';
}

module.exports = { 
  createReferral, 
  updateReferralStatus, 
  getFacilityReferrals,
  getFacilityStats
};
