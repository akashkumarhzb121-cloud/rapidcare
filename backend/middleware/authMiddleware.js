const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    console.log('Auth Header:', authHeader ? 'Present' : 'Missing');
    
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    console.log('Token received, verifying...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', { userId: decoded.userId, role: decoded.role });
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      return res.status(401).json({ error: 'User not found' });
    }
    
    console.log('User found:', { id: user._id, role: user.role, name: user.name });
    
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(401).json({ error: 'Authentication failed' });
  }
};

const roleMiddleware = (roles) => {
  return (req, res, next) => {
    console.log('Checking role:', req.userRole, 'Allowed roles:', roles);
    
    if (!req.userRole) {
      console.log('No role found in request');
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    
    if (!roles.includes(req.userRole)) {
      console.log('Role mismatch:', req.userRole, 'not in', roles);
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    
    console.log('Role check passed');
    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
