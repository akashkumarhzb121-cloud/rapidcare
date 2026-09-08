const User = require('../models/User');
const Hospital = require('../models/Hospital');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { name, email, password, role, hospitalId } = req.body;
    
    // Validate role
    if (!['ambulance_operator', 'hospital_staff'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // For hospital staff, validate hospital linkage
    let linkedHospitalId = null;
    if (role === 'hospital_staff') {
      if (!hospitalId) {
        return res.status(400).json({ error: 'Hospital ID required for hospital staff' });
      }
      
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
        return res.status(404).json({ error: 'Hospital not found' });
      }
      
      // Check if hospital already has staff assigned
      if (hospital.staffUserId) {
        return res.status(400).json({ error: 'Hospital already has staff assigned' });
      }
      
      linkedHospitalId = hospitalId;
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      linkedHospitalId
    });
    
    await user.save();
    
    // Update hospital with staff user ID if applicable
    if (role === 'hospital_staff' && linkedHospitalId) {
      await Hospital.findByIdAndUpdate(linkedHospitalId, { staffUserId: user._id });
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
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = generateToken(user);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        linkedHospitalId: user.linkedHospitalId
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