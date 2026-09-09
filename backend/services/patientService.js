const Patient = require('../models/Patient');
const Referral = require('../models/Referral');
const Incident = require('../models/Incident');
const FollowUpSchedule = require('../models/FollowUpSchedule');

// Register new patient
async function registerPatient(patientData, userId, facilityId) {
  const patient = new Patient({
    ...patientData,
    registeredBy: userId,
    registeredAtFacility: facilityId || null
  });
  
  await patient.save();
  return patient;
}

// Get patient history
async function getPatientHistory(patientId) {
  const patient = await Patient.findById(patientId)
    .populate('registeredBy', 'name email')
    .populate('registeredAtFacility', 'name facilityType');
  
  if (!patient) {
    throw new Error('Patient not found');
  }
  
  const referrals = await Referral.find({ patientId })
    .populate('fromFacilityId', 'name facilityType')
    .populate('toFacilityId', 'name facilityType')
    .sort('-createdAt');
  
  const incidents = await Incident.find({ patientId })
    .populate('assignedHospitalId', 'name facilityType')
    .sort('-createdAt');
  
  const followUps = await FollowUpSchedule.find({ patientId })
    .populate('assignedTo', 'name')
    .sort('dueDate');
  
  return {
    patient,
    referrals,
    incidents,
    followUps,
    summary: {
      totalReferrals: referrals.length,
      totalIncidents: incidents.length,
      totalFollowUps: followUps.length,
      pendingFollowUps: followUps.filter(f => f.status === 'scheduled').length,
      completedReferrals: referrals.filter(r => r.status === 'completed').length
    }
  };
}

// Search patients
async function searchPatients(query, limit = 20) {
  const searchQuery = query
    ? { $or: [
        { name: { $regex: query, $options: 'i' } },
        { village: { $regex: query, $options: 'i' } },
        { abhaId: { $regex: query, $options: 'i' } }
      ]}
    : {};
  
  return await Patient.find(searchQuery).limit(limit).sort('-createdAt');
}

module.exports = { registerPatient, getPatientHistory, searchPatients };
