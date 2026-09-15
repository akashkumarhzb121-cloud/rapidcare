const mongoose = require('mongoose');
const Facility = require('../models/Facility');
const Referral = require('../models/Referral');
const Incident = require('../models/Incident');
const Patient = require('../models/Patient');
const Queue = require('../models/Queue');
const Appointment = require('../models/Appointment');
const DiagnosticOrder = require('../models/DiagnosticOrder');
const FollowUpSchedule = require('../models/FollowUpSchedule');

// Get all facilities with live status for map
async function getFacilityMapData(filters = {}) {
  const query = {};
  if (filters.district) query.district = filters.district;
  if (filters.facilityType) query.facilityType = filters.facilityType;

  const facilities = await Facility.find(query)
    .select('name facilityType location address district taluka totalBeds availableBeds specializations contactNumber rating accreditation')
    .lean();

  // Compute occupancy rate and status
  return facilities.map(f => {
    const occupancyRate = f.totalBeds > 0 
      ? Math.round(((f.totalBeds - f.availableBeds) / f.totalBeds) * 100) 
      : 0;
    
    let status = 'good';
    if (f.availableBeds === 0) status = 'full';
    else if (occupancyRate >= 90) status = 'critical';
    else if (occupancyRate >= 75) status = 'busy';

    return {
      ...f,
      occupancyRate,
      status,
      markerColor:
        status === 'full' ? '#dc2626' :
        status === 'critical' ? '#ef4444' :
        status === 'busy' ? '#f59e0b' : '#10b981'
    };
  });
}

// Overview stats for district admin
async function getDistrictOverview(filters = {}) {
  const query = {};
  if (filters.district) query.district = filters.district;

  const facilities = await Facility.find(query).lean();
  const facilityIds = facilities.map(f => f._id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalPatients,
    totalReferrals,
    completedReferrals,
    pendingReferrals,
    totalIncidents,
    completedIncidents,
    activeEmergencies,
    diagnosticsPending,
    diagnosticsReady,
    followUpsDue
  ] = await Promise.all([
    Patient.countDocuments({}),
    Referral.countDocuments({ fromFacilityId: { $in: facilityIds } }),
    Referral.countDocuments({ fromFacilityId: { $in: facilityIds }, status: 'completed' }),
    Referral.countDocuments({ fromFacilityId: { $in: facilityIds }, status: { $in: ['initiated', 'in-transit'] } }),
    Incident.countDocuments({ assignedHospitalId: { $in: facilityIds } }),
    Incident.countDocuments({ assignedHospitalId: { $in: facilityIds }, status: 'completed' }),
    Incident.countDocuments({ assignedHospitalId: { $in: facilityIds }, status: { $in: ['dispatched', 'acknowledged'] } }),
    DiagnosticOrder.countDocuments({ facilityId: { $in: facilityIds }, status: { $in: ['ordered', 'sample-collected'] } }),
    DiagnosticOrder.countDocuments({ facilityId: { $in: facilityIds }, status: 'ready' }),
    FollowUpSchedule.countDocuments({ status: 'scheduled', dueDate: { $lte: today } })
  ]);

  // Aggregate bed info
  const totalBeds = facilities.reduce((sum, f) => sum + f.totalBeds, 0);
  const availableBeds = facilities.reduce((sum, f) => sum + f.availableBeds, 0);
  const occupancyRate = totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0;

  return {
    totalFacilities: facilities.length,
    totalPatients,
    totalBeds,
    availableBeds,
    occupancyRate,
    referrals: {
      total: totalReferrals,
      completed: completedReferrals,
      pending: pendingReferrals,
      completionRate: totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100) : 0
    },
    emergencies: {
      total: totalIncidents,
      completed: completedIncidents,
      active: activeEmergencies
    },
    diagnostics: {
      pending: diagnosticsPending,
      ready: diagnosticsReady
    },
    followUpsDue
  };
}

// Referral completion trend (last 14 days)
async function getReferralTrend(filters = {}, days = 14) {
  const query = {};
  if (filters.district) {
    const facilities = await Facility.find({ district: filters.district }).select('_id').lean();
    query.fromFacilityId = { $in: facilities.map(f => f._id) };
  }

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const referrals = await Referral.aggregate([
    { $match: { ...query, createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Fill missing dates
  const results = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found = referrals.find(r => r._id === dateStr);
    results.push({
      date: dateStr,
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      total: found?.total || 0,
      completed: found?.completed || 0,
      critical: found?.critical || 0
    });
  }

  return results;
}

// Emergency type distribution
async function getEmergencyDistribution(filters = {}) {
  const query = {};
  if (filters.district) {
    const facilities = await Facility.find({ district: filters.district }).select('_id').lean();
    query.assignedHospitalId = { $in: facilities.map(f => f._id) };
  }

  const data = await Incident.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$requiredSpecialization',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const colors = {
    cardiac: '#ef4444',
    trauma: '#f59e0b',
    respiratory: '#8b5cf6',
    general: '#0ea5e9',
    neurology: '#ec4899',
    pediatric: '#10b981',
    maternal: '#f43f5e',
    orthopedic: '#6366f1'
  };

  return data.map(d => ({
    name: (d._id || 'unknown').charAt(0).toUpperCase() + (d._id || 'unknown').slice(1),
    value: d.count,
    color: colors[d._id] || '#94a3b8'
  }));
}

// Severity distribution
async function getSeverityDistribution(filters = {}) {
  const query = {};
  if (filters.district) {
    const facilities = await Facility.find({ district: filters.district }).select('_id').lean();
    query.fromFacilityId = { $in: facilities.map(f => f._id) };
  }

  const data = await Referral.aggregate([
    { $match: query },
    { $group: { _id: '$severity', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const colors = {
    critical: '#ef4444',
    moderate: '#f59e0b',
    mild: '#10b981'
  };

  return data.map(d => ({
    name: (d._id || 'unknown').charAt(0).toUpperCase() + (d._id || 'unknown').slice(1),
    value: d.count,
    color: colors[d._id] || '#94a3b8'
  }));
}

// Medicine shortage alerts
async function getMedicineShortages(filters = {}, threshold = 500) {
  const query = {};
  if (filters.district) query.district = filters.district;

  const facilities = await Facility.find(query)
    .select('name district medicineStock')
    .lean();

  const shortages = [];
  for (const f of facilities) {
    for (const med of f.medicineStock || []) {
      if (med.quantity < threshold) {
        shortages.push({
          facilityId: f._id,
          facilityName: f.name,
          district: f.district,
          medicine: med.name,
          category: med.category,
          quantity: med.quantity,
          unit: med.unit,
          severity: med.quantity === 0 ? 'critical' : med.quantity < threshold / 2 ? 'high' : 'medium'
        });
      }
    }
  }

  return shortages.sort((a, b) => a.quantity - b.quantity);
}

// Facility ranking (top performers / worst performers)
async function getFacilityRanking(filters = {}) {
  const query = {};
  if (filters.district) query.district = filters.district;

  const facilities = await Facility.find(query).lean();

  const ranked = await Promise.all(facilities.map(async (f) => {
    const [totalReferrals, completedReferrals, totalIncidents, completedIncidents] = await Promise.all([
      Referral.countDocuments({ toFacilityId: f._id }),
      Referral.countDocuments({ toFacilityId: f._id, status: 'completed' }),
      Incident.countDocuments({ assignedHospitalId: f._id }),
      Incident.countDocuments({ assignedHospitalId: f._id, status: 'completed' })
    ]);

    const completionRate = totalReferrals > 0 
      ? Math.round((completedReferrals / totalReferrals) * 100) 
      : 0;

    const occupancyRate = f.totalBeds > 0 
      ? Math.round(((f.totalBeds - f.availableBeds) / f.totalBeds) * 100) 
      : 0;

    return {
      facilityId: f._id,
      name: f.name,
      district: f.district,
      facilityType: f.facilityType,
      totalBeds: f.totalBeds,
      availableBeds: f.availableBeds,
      occupancyRate,
      totalReferrals,
      completedReferrals,
      completionRate,
      totalIncidents,
      completedIncidents,
      rating: f.rating
    };
  }));

  return ranked.sort((a, b) => b.completionRate - a.completionRate);
}

// District-level rollup
async function getDistrictBreakdown() {
  const districts = await Facility.distinct('district');

  const breakdown = await Promise.all(districts.filter(Boolean).map(async (district) => {
    const facilities = await Facility.find({ district }).lean();
    const facilityIds = facilities.map(f => f._id);

    const totalBeds = facilities.reduce((s, f) => s + f.totalBeds, 0);
    const availableBeds = facilities.reduce((s, f) => s + f.availableBeds, 0);

    const [refTotal, refCompleted, incTotal] = await Promise.all([
      Referral.countDocuments({ fromFacilityId: { $in: facilityIds } }),
      Referral.countDocuments({ fromFacilityId: { $in: facilityIds }, status: 'completed' }),
      Incident.countDocuments({ assignedHospitalId: { $in: facilityIds } })
    ]);

    return {
      district,
      facilities: facilities.length,
      totalBeds,
      availableBeds,
      occupancyRate: totalBeds > 0 ? Math.round(((totalBeds - availableBeds) / totalBeds) * 100) : 0,
      referrals: refTotal,
      completedReferrals: refCompleted,
      completionRate: refTotal > 0 ? Math.round((refCompleted / refTotal) * 100) : 0,
      incidents: incTotal
    };
  }));

  return breakdown.sort((a, b) => b.facilities - a.facilities);
}

module.exports = {
  getFacilityMapData,
  getDistrictOverview,
  getReferralTrend,
  getEmergencyDistribution,
  getSeverityDistribution,
  getMedicineShortages,
  getFacilityRanking,
  getDistrictBreakdown
};
