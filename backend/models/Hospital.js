const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  address: {
    type: String,
    required: true
  },
  specializations: [{
    type: String,
    enum: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric'],
    required: true
  }],
  totalBeds: {
    type: Number,
    required: true,
    min: 0
  },
  availableBeds: {
    type: Number,
    required: true,
    min: 0
  },
  contactNumber: {
    type: String,
    required: true
  },
  staffUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // New fields for verification and transparency
  accreditation: {
    type: String,
    enum: ['NABH', 'JCI', 'ISO', 'None'],
    default: 'NABH'
  },
  emergencyServices: [{
    type: String,
    enum: ['Cath Lab', 'Trauma Bay', 'Ventilator', 'CT Scan', 'MRI', 'Blood Bank', 
           'ICU', 'NICU', 'Emergency Medicine', 'Pharmacy', 'Ambulance Bay']
  }],
  lastBedUpdate: {
    type: Date,
    default: Date.now
  },
  bedUpdateSource: {
    type: String,
    enum: ['manual', 'automated', 'estimated'],
    default: 'manual'
  },
  averageResponseTime: {
    type: Number, // in minutes
    default: 15
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 4.5
  }
}, {
  timestamps: true
});

// Ensure available beds doesn't exceed total beds
hospitalSchema.pre('save', function(next) {
  if (this.availableBeds > this.totalBeds) {
    this.availableBeds = this.totalBeds;
  }
  next();
});

module.exports = mongoose.model('Hospital', hospitalSchema);
