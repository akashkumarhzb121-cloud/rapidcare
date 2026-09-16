const mongoose = require('mongoose');

const helpRequestSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  patientPhone: {
    type: String,
    required: true,
    trim: true
  },
  patientVillage: {
    type: String,
    default: ''
  },
  patientDistrict: {
    type: String,
    default: ''
  },
  issue: {
    type: String,
    required: true
  },
  urgency: {
    type: String,
    enum: ['emergency', 'urgent', 'normal'],
    default: 'normal'
  },
  // Who the patient wants to reach
  targetRole: {
    type: String,
    enum: ['ambulance_operator', 'hospital_staff', 'community_health_worker', 'any'],
    required: true
  },
  // Optional specific facility
  targetFacilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'claimed', 'resolved', 'cancelled'],
    default: 'pending'
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolutionNotes: {
    type: String,
    default: ''
  },
  // Optional patient location for operators
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  }
}, { timestamps: true });

helpRequestSchema.index({ status: 1, createdAt: -1 });
helpRequestSchema.index({ targetRole: 1, status: 1 });

module.exports = mongoose.model('HelpRequest', helpRequestSchema);
