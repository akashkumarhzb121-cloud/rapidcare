const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  facilityType: {
    type: String,
    enum: ['sub-centre', 'phc', 'rural-hospital', 'district-hospital'],
    required: true
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  address: {
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
  parentFacility: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    default: null
  },
  specializations: [{
    type: String,
    enum: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric', 'maternal', 'orthopedic']
  }],
  totalBeds: {
    type: Number,
    default: 0
  },
  availableBeds: {
    type: Number,
    default: 0
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
  // Medicine stock
  medicineStock: [{
    name: String,
    category: String,
    quantity: Number,
    unit: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  // Diagnostic services
  diagnosticServices: [{
    name: String,
    available: {
      type: Boolean,
      default: true
    },
    waitTimeHours: {
      type: Number,
      default: 2
    }
  }],
  accreditation: {
    type: String,
    enum: ['NABH', 'JCI', 'ISO', 'None'],
    default: 'None'
  },
  emergencyServices: [{
    type: String
  }],
  averageResponseTime: {
    type: Number,
    default: 15
  },
  rating: {
    type: Number,
    default: 4.0,
    min: 0,
    max: 5
  }
}, {
  timestamps: true
});

// Index for geospatial queries
facilitySchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Facility', facilitySchema);
