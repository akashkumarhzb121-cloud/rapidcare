const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  patientDescription: { type: String, required: true },
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
  aiReasoning: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'matched', 'dispatched', 'acknowledged', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedHospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', default: null },
  ambulanceLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: '' },
    displayName: { type: String, default: '' }
  },
  patientLocation: { type: String, default: '' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', default: null },
  linkedReferral: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', default: null },
  bedReserved: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ============ VERIFICATION FIELDS ============
  dispatchedAt: { type: Date, default: null },
  acknowledgedAt: { type: Date, default: null },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verificationNotes: { type: String, default: '' },
  rejectedReason: { type: String, default: '' },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);
