const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Facility = require('../models/Facility');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
  try {
    const { name, email, password, role, hospitalId, facilityId } = req.body;
    
    // Validate role
    if (!['ambulance_operator', 'hospital_staff', 'community_health_worker'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // For hospital staff, validate hospital linkage
    let linkedHospitalId = null;
    let linkedFacilityId = null;
    
    if (role === 'hospital_staff') {
      if (!hospitalId && !facilityId) {
        return res.status(400).json({ error: 'Hospital/Facility ID required for hospital staff' });
      }
      
      const facility = await Facility.findById(facilityId || hospitalId);
      if (!facility) {
        return res.status(404).json({ error: 'Facility not found' });
      }
      
      linkedFacilityId = facility._id;
      linkedHospitalId = facility._id;
    }
    
    if (role === 'community_health_worker') {
      linkedFacilityId = facilityId || null;
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      linkedFacilityId,
      linkedHospitalId
    });
    
    await user.save();
    
    // Update facility with staff user ID if applicable
    if (role === 'hospital_staff' && linkedFacilityId) {
      await Facility.findByIdAndUpdate(linkedFacilityId, { staffUserId: user._id });
    }
    
    // Generate JWT
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        linkedFacilityId: user.linkedFacilityId,
        linkedHospitalId: user.linkedHospitalId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('\n=== Login Attempt ===');
    console.log('Email:', email);
    console.log('Password provided:', password ? 'YES' : 'NO');
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('User found:', user.name);
    console.log('Role:', user.role);
    
    // Check password using bcrypt directly
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password mismatch for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = generateToken(user);
    
    console.log('Login successful:', user.name);
    console.log('=== Login Complete ===\n');
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        linkedFacilityId: user.linkedFacilityId,
        linkedHospitalId: user.linkedHospitalId,
        languagePreference: user.languagePreference
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = { register, login };
