const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 0
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  village: {
    type: String,
    required: true
  },
  district: {
    type: String,
    default: ''
  },
  state: {
    type: String,
    default: 'Maharashtra'
  },
  phone: {
    type: String,
    default: ''
  },
  languagePreference: {
    type: String,
    enum: ['en', 'hi', 'mr', 'english', 'hindi', 'marathi'],
    default: 'mr'
  },
  chronicConditions: [{
    type: String,
    enum: ['diabetes', 'hypertension', 'asthma', 'heart_disease', 'tuberculosis', 'none']
  }],
  highRiskFlags: [{
    type: String,
    enum: ['pregnancy', 'child_under_5', 'elderly', 'chronic', 'post_surgery']
  }],
  abhaId: {
    type: String,
    default: ''
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registeredAtFacility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility'
  },
  lastVisitDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

patientSchema.index({ name: 'text', village: 'text', abhaId: 'text' });

module.exports = mongoose.model('Patient', patientSchema);
