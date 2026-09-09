const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  referralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral',
    default: null
  },
  condition: {
    type: String,
    required: true
  },
  scheduleType: {
    type: String,
    enum: ['maternal', 'child', 'chronic', 'post-referral', 'post-discharge'],
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'missed', 'cancelled'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  completedDate: {
    type: Date,
    default: null
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Index for due date queries
followUpSchema.index({ dueDate: 1, status: 1 });
followUpSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('FollowUpSchedule', followUpSchema);
