const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  facilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    required: true,
    index: true
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Time slot
  scheduledAt: {
    type: Date,
    required: true,
    index: true
  },
  durationMinutes: {
    type: Number,
    default: 30
  },
  // Department / specialty
  department: {
    type: String,
    enum: ['general', 'cardiac', 'trauma', 'respiratory', 'neurology', 'pediatric', 'maternal', 'orthopedic'],
    default: 'general'
  },
  reason: {
    type: String,
    required: true
  },
  // Status
  status: {
    type: String,
    enum: ['booked', 'confirmed', 'checked-in', 'in-consultation', 'completed', 'no-show', 'cancelled'],
    default: 'booked'
  },
  // Optional link to a doctor
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Reminder flags (for future SMS integration)
  reminderSent24h: { type: Boolean, default: false },
  reminderSent2h: { type: Boolean, default: false },
  // Feedback after visit
  notes: { type: String, default: '' },
  cancellationReason: { type: String, default: '' }
}, { timestamps: true });

appointmentSchema.index({ facilityId: 1, scheduledAt: 1, status: 1 });
appointmentSchema.index({ patientId: 1, scheduledAt: -1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
