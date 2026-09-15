const Appointment = require('../models/Appointment');
const Facility = require('../models/Facility');
const Patient = require('../models/Patient');
const User = require('../models/User');

// Book an appointment
async function bookAppointment(data, userId) {
  const {
    patientId,
    facilityId,
    scheduledAt,
    department = 'general',
    reason,
    durationMinutes = 30
  } = data;

  const facility = await Facility.findById(facilityId);
  if (!facility) throw new Error('Facility not found');

  const patient = await Patient.findById(patientId);
  if (!patient) throw new Error('Patient not found');

  const scheduled = new Date(scheduledAt);
  if (isNaN(scheduled.getTime())) throw new Error('Invalid appointment date/time');
  if (scheduled < new Date()) throw new Error('Cannot book appointment in the past');

  // Check slot conflict (same facility, same time ± 15 min)
  const conflictWindow = new Date(scheduled.getTime() - 15 * 60000);
  const conflictEnd = new Date(scheduled.getTime() + 15 * 60000);
  const conflict = await Appointment.findOne({
    facilityId,
    status: { $in: ['booked', 'confirmed', 'checked-in'] },
    scheduledAt: { $gte: conflictWindow, $lte: conflictEnd }
  });

  if (conflict) {
    throw new Error('This time slot is already taken. Please choose another.');
  }

  const appointment = new Appointment({
    patientId,
    facilityId,
    bookedBy: userId,
    scheduledAt: scheduled,
    department,
    reason,
    durationMinutes
  });

  await appointment.save();

  return await Appointment.findById(appointment._id)
    .populate('patientId', 'name age gender village phone')
    .populate('facilityId', 'name district address');
}

// Get appointments for a facility on a given date
async function getFacilityAppointments(facilityId, date = null, status = null) {
  const query = { facilityId };

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.scheduledAt = { $gte: start, $lte: end };
  }

  if (status) {
    if (Array.isArray(status)) query.status = { $in: status };
    else query.status = status;
  }

  return Appointment.find(query)
    .populate('patientId', 'name age gender village phone chronicConditions highRiskFlags')
    .populate('bookedBy', 'name')
    .populate('doctorId', 'name specialization')
    .sort('scheduledAt')
    .lean();
}

// Get upcoming appointments for a CHW's patients
async function getUpcomingForCHW(chwId) {
  const now = new Date();
  return Appointment.find({
    bookedBy: chwId,
    scheduledAt: { $gte: now },
    status: { $in: ['booked', 'confirmed'] }
  })
    .populate('patientId', 'name age village')
    .populate('facilityId', 'name district address')
    .sort('scheduledAt')
    .lean();
}

// Update appointment status
async function updateStatus(appointmentId, status, userId, notes = '') {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error('Appointment not found');

  appointment.status = status;
  if (notes) appointment.notes = notes;

  await appointment.save();
  return appointment;
}

// Cancel appointment
async function cancelAppointment(appointmentId, userId, reason = '') {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new Error('Appointment not found');

  if (appointment.status === 'completed') {
    throw new Error('Cannot cancel a completed appointment');
  }

  appointment.status = 'cancelled';
  appointment.cancellationReason = reason;
  await appointment.save();
  return appointment;
}

// Get today's counts for staff dashboard
async function getTodayStats(facilityId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [booked, completed, noShow, cancelled] = await Promise.all([
    Appointment.countDocuments({ facilityId, scheduledAt: { $gte: today, $lt: tomorrow }, status: { $in: ['booked', 'confirmed', 'checked-in', 'in-consultation'] } }),
    Appointment.countDocuments({ facilityId, scheduledAt: { $gte: today, $lt: tomorrow }, status: 'completed' }),
    Appointment.countDocuments({ facilityId, scheduledAt: { $gte: today, $lt: tomorrow }, status: 'no-show' }),
    Appointment.countDocuments({ facilityId, scheduledAt: { $gte: today, $lt: tomorrow }, status: 'cancelled' }),
  ]);

  return { booked, completed, noShow, cancelled };
}

// Get available slots for a facility on a date (returns every 30 min from 9am to 5pm)
async function getAvailableSlots(facilityId, date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  const booked = await Appointment.find({
    facilityId,
    scheduledAt: { $gte: day, $lt: new Date(day.getTime() + 86400000) },
    status: { $in: ['booked', 'confirmed', 'checked-in', 'in-consultation'] }
  }).select('scheduledAt').lean();

  const bookedTimes = booked.map(b => new Date(b.scheduledAt).getTime());

  const slots = [];
  const startHour = 9;
  const endHour = 17;
  const slotMinutes = 30;

  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += slotMinutes) {
      const slot = new Date(day);
      slot.setHours(h, m, 0, 0);

      // Skip past slots
      if (slot < new Date()) continue;

      const isBooked = bookedTimes.some(t => Math.abs(t - slot.getTime()) < 15 * 60000);
      slots.push({
        time: slot.toISOString(),
        display: slot.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        available: !isBooked
      });
    }
  }

  return slots;
}

module.exports = {
  bookAppointment,
  getFacilityAppointments,
  getUpcomingForCHW,
  updateStatus,
  cancelAppointment,
  getTodayStats,
  getAvailableSlots
};
