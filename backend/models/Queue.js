const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenNumber: {
    type: Number,
    required: true
  },
  // Priority-based ordering (emergency jumps to front)
  priority: {
    type: String,
    enum: ['emergency', 'high', 'normal'],
    default: 'normal'
  },
  reason: {
    type: String,
    default: ''  // Chief complaint
  },
  status: {
    type: String,
    enum: ['waiting', 'called', 'in-consultation', 'done', 'skipped', 'cancelled'],
    default: 'waiting'
  },
  // Timing
  joinedAt: { type: Date, default: Date.now },
  calledAt: { type: Date, default: null },
  consultStartedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  // Estimated consultation duration (set by staff when calling)
  estimatedMinutes: { type: Number, default: 10 },
  notes: { type: String, default: '' }
}, { timestamps: true });

// Compound index for fast queue lookups
queueSchema.index({ facilityId: 1, status: 1, priority: 1, joinedAt: 1 });

// Auto-generate token number before required-field validation
queueSchema.pre('validate', async function(next) {
  if (this.isNew && this.tokenNumber == null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await mongoose.model('Queue').countDocuments({
      facilityId: this.facilityId,
      joinedAt: { $gte: today }
    });

    this.tokenNumber = todayCount + 1;
  }
  next();
});

module.exports = mongoose.model('Queue', queueSchema);
