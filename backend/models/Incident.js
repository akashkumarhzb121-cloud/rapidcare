const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  patientDescription: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['critical', 'moderate', 'mild'],
    required: true
  },
  requiredSpecialization: {
    type: String,
    enum: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric'],
    required: true
  },
  aiReasoning: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'matched', 'dispatched', 'completed'],
    default: 'pending'
  },
  assignedHospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    default: null
  },
  ambulanceLocation: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      default: ''
    },
    displayName: {
      type: String,
      default: ''
    }
  },
  patientLocation: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Incident', incidentSchema);
