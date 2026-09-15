const mongoose = require('mongoose');

const teleconsultSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  chwId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Jitsi room ID — unique, permanent link
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  // What the specialist needs to know
  symptoms: {
    type: String,
    required: true
  },
  requiredSpecialization: {
    type: String,
    enum: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric', 'maternal', 'orthopedic'],
    required: true
  },
  // AI preliminary triage
  aiSeverity: {
    type: String,
    enum: ['critical', 'moderate', 'mild'],
    default: 'moderate'
  },
  aiReasoning: {
    type: String,
    default: ''
  },
  // Lifecycle
  status: {
    type: String,
    enum: ['requested', 'accepted', 'active', 'completed', 'cancelled', 'missed'],
    default: 'requested'
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'normal'],
    default: 'normal'
  },
  // Timing
  requestedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  startedAt: {
    type: Date,
    default: null
  },
  endedAt: {
    type: Date,
    default: null
  },
  durationMinutes: {
    type: Number,
    default: 0
  },
  // Doctor's prescription after call
  prescription: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  diagnosis: {
    type: String,
    default: ''
  },
  followUpDays: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

teleconsultSchema.index({ status: 1, requestedAt: -1 });
teleconsultSchema.index({ doctorId: 1, status: 1 });
teleconsultSchema.index({ requiredSpecialization: 1, status: 1 });

module.exports = mongoose.model('Teleconsultation', teleconsultSchema);
