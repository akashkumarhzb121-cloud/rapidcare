const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  fromFacilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true
  },
  toFacilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  aiReasoning: {
    type: String,
    default: ''
  },
  severity: {
    type: String,
    enum: ['critical', 'moderate', 'mild'],
    required: true
  },
  requiredSpecialization: {
    type: String,
    enum: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric', 'maternal', 'orthopedic'],
    required: true
  },
  referralType: {
    type: String,
    enum: ['routine', 'urgent', 'emergency'],
    default: 'routine'
  },
  status: {
    type: String,
    enum: ['initiated', 'in-transit', 'received', 'completed', 'cancelled'],
    default: 'initiated'
  },
  isEmergencyFlagged: {
    type: Boolean,
    default: false
  },
  linkedIncident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident',
    default: null
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  timeline: [{
    status: {
      type: String,
      enum: ['initiated', 'in-transit', 'received', 'completed', 'cancelled']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facility'
    },
    notes: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Referral', referralSchema);
