const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['ambulance_operator', 'hospital_staff', 'community_health_worker', 'specialist', 'district_admin'],
    required: true
  },
  linkedFacilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', default: null },
  linkedHospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', default: null },
  languagePreference: {
    type: String,
    enum: ['en', 'hi', 'mr'],
    default: 'en'
  },
  specialization: {
    type: String,
    enum: ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric', 'maternal', 'orthopedic', null],
    default: null
  },
  phone: { type: String, default: '' },
  isAvailableForConsult: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  if (this.password.startsWith('$2')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) { next(error); }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
