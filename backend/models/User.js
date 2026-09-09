const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['ambulance_operator', 'hospital_staff', 'community_health_worker'],
    required: true
  },
  linkedFacilityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    default: null
  },
  linkedHospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Facility',
    default: null
  },
  languagePreference: {
    type: String,
    enum: ['english', 'hindi', 'marathi'],
    default: 'english'
  },
  phone: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified and not already hashed
  if (!this.isModified('password')) return next();
  
  // Check if password is already hashed (bcrypt hashes start with $2)
  if (this.password.startsWith('$2')) {
    console.log('Password already hashed, skipping');
    return next();
  }
  
  try {
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing password...');
    console.log('Stored hash starts with:', this.password?.substring(0, 4));
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    console.log('Password match:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
