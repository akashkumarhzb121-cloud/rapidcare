const Referral = require('../models/Referral');
const Incident = require('../models/Incident');
const Facility = require('../models/Facility');
const { analyzePatientCondition } = require('./aiService');
const { geocodeLocation } = require('./locationService');

// Create referral with AI triage
async function createReferral(data, userId) {
  const {
    patientId,
    fromFacilityId,
    toFacilityId,
    patientDescription,
    patientLocation
  } = data;
  
  console.log('=== Creating Referral ===');
  console.log('Patient:', patientId);
  console.log('From Facility:', fromFacilityId);
  console.log('Description:', patientDescription);
  
  // Get from facility for location reference
  const fromFacility = await Facility.findById(fromFacilityId);
  console.log('From facility location:', fromFacility?.location);
  
  // Default location - use from facility's location
  let ambulanceLocation = {
    lat: fromFacility?.location?.lat || 0,
    lng: fromFacility?.location?.lng || 0,
    address: fromFacility?.address || '',
    displayName: fromFacility?.name || ''
  };
  
  // Geocode patient location if provided as string
  if (typeof patientLocation === 'string' && patientLocation.trim()) {
    console.log('Geocoding patient location:', patientLocation);
    const geocoded = await geocodeLocation(patientLocation);
    if (geocoded) {
      ambulanceLocation = {
        lat: geocoded.lat,
        lng: geocoded.lng,
        address: formatAddress(geocoded.address),
        displayName: geocoded.displayName
      };
      console.log('Geocoded location:', ambulanceLocation);
    }
  } else if (patientLocation && patientLocation.lat && patientLocation.lng) {
    // If patientLocation is already coordinates
    ambulanceLocation = {
      lat: patientLocation.lat,
      lng: patientLocation.lng,
      address: patientLocation.address || '',
      displayName: patientLocation.displayName || ''
    };
  }
  
  console.log('Final ambulance location:', ambulanceLocation);
  
  // AI Triage
  const aiResponse = await analyzePatientCondition(patientDescription);
  console.log('AI Response:', aiResponse);
  
  // Determine referral type
  let referralType = 'routine';
  if (aiResponse.severity === 'critical') {
    referralType = 'emergency';
  } else if (aiResponse.severity === 'moderate') {
    referralType = 'urgent';
  }
  
  // Create referral
  const referral = new Referral({
    patientId,
    fromFacilityId,
    toFacilityId,
    reason: patientDescription,
    aiReasoning: aiResponse.aiReasoning,
    severity: aiResponse.severity,
    requiredSpecialization: aiResponse.requiredSpecialization,
    referralType,
    status: 'initiated',
    timeline: [{
      status: 'initiated',
      updatedBy: userId,
      facilityId: fromFacilityId,
      notes: 'Referral created'
    }],
    createdBy: userId
  });
  
  await referral.save();
  console.log('Referral created:', referral._id);
  
  // If critical, auto-create incident (existing flow)
  if (aiResponse.severity === 'critical') {
    console.log('Critical case - creating emergency incident');
    
    try {
      const incident = new Incident({
        patientDescription,
        severity: aiResponse.severity,
        requiredSpecialization: aiResponse.requiredSpecialization,
        aiReasoning: aiResponse.aiReasoning,
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
      
      // Link incident to referral
      referral.linkedIncident = incident._id;
      await referral.save();
      
      // Find matching hospitals
      const matchingHospitals = await Facility.find({
        specializations: aiResponse.requiredSpecialization,
        availableBeds: { $gt: 0 },
        facilityType: 'district-hospital'
      });
      
      if (matchingHospitals.length > 0) {
        const { rankHospitals } = require('./distanceService');
        const rankedHospitals = rankHospitals(matchingHospitals, ambulanceLocation);
        
        return { 
          referral, 
          incident, 
          aiResponse,
          matchedHospitals: rankedHospitals
        };
      }
      
      return { referral, incident, aiResponse, matchedHospitals: [] };
      
    } catch (error) {
      console.error('Error creating incident:', error);
      // Still return referral even if incident creation fails
      return { referral, incident: null, aiResponse, error: error.message };
    }
  }
  
  return { referral, incident: null, aiResponse, matchedHospitals: [] };
}

// Update referral status
async function updateReferralStatus(referralId, newStatus, userId, facilityId, notes = '') {
  const referral = await Referral.findById(referralId);
  if (!referral) {
    throw new Error('Referral not found');
  }
  
  referral.status = newStatus;
  referral.timeline.push({
    status: newStatus,
    updatedBy: userId,
    facilityId,
    notes,
    timestamp: new Date()
  });
  
  await referral.save();
  return referral;
}

// Get facility referrals
async function getFacilityReferrals(facilityId, type = 'incoming') {
  const query = type === 'incoming' 
    ? { toFacilityId: facilityId }
    : { fromFacilityId: facilityId };
  
  return await Referral.find(query)
    .populate('patientId', 'name age village')
    .populate('fromFacilityId', 'name facilityType')
    .populate('toFacilityId', 'name facilityType')
    .sort('-createdAt');
}

function formatAddress(addressObj) {
  if (!addressObj) return '';
  if (typeof addressObj === 'string') return addressObj;
  
  const parts = [];
  const fields = ['road', 'suburb', 'city', 'town', 'village', 'state', 'postcode', 'country'];
  for (const field of fields) {
    if (addressObj[field]) parts.push(addressObj[field]);
  }
  return parts.join(', ') || 'Location provided';
}

module.exports = { createReferral, updateReferralStatus, getFacilityReferrals };
