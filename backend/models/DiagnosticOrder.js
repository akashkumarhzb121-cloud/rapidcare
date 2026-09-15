const mongoose = require('mongoose');

const diagnosticOrderSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true,
    index: true
  },
  orderedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Tests requested
  tests: [{
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['blood', 'imaging', 'cardiac', 'urine', 'other'],
      default: 'other'
    },
    status: {
      type: String,
      enum: ['ordered', 'sample-collected', 'in-progress', 'ready'],
      default: 'ordered'
    },
    reportUrl: { type: String, default: '' },
    reportNotes: { type: String, default: '' },
    completedAt: { type: Date, default: null }
  }],
  // Order-level status (aggregate of all test statuses)
  status: {
    type: String,
    enum: ['ordered', 'sample-collected', 'in-progress', 'ready', 'delivered', 'cancelled'],
    default: 'ordered',
    index: true
  },
  priority: {
    type: String,
    enum: ['urgent', 'high', 'normal'],
    default: 'normal'
  },
  // Clinical context
  reason: {
    type: String,
    required: true
  },
  clinicalNotes: {
    type: String,
    default: ''
  },
  // Expected turn-around
  expectedReadyBy: {
    type: Date,
    default: null
  },
  // Timestamps for lifecycle
  orderedAt: { type: Date, default: Date.now },
  sampleCollectedAt: { type: Date, default: null },
  inProgressAt: { type: Date, default: null },
  readyAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  // Staff who processed
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

diagnosticOrderSchema.index({ facilityId: 1, status: 1, orderedAt: -1 });
diagnosticOrderSchema.index({ patientId: 1, orderedAt: -1 });

module.exports = mongoose.model('DiagnosticOrder', diagnosticOrderSchema);
