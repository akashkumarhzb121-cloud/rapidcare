const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure CORS
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  'https://rapidcare108.vercel.app',
  'http://localhost:3000'
];

const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Make io available to routes
app.set('io', io);

// Import routes
const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const patientRoutes = require('./routes/patientRoutes');
const referralRoutes = require('./routes/referralRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const followUpRoutes = require('./routes/followUpRoutes');

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('joinHospitalRoom', (hospitalId) => {
    socket.join(`hospital_${hospitalId}`);
    socket.join(`facility_${hospitalId}`);
    console.log(`Socket ${socket.id} joined hospital_${hospitalId}`);
  });
  
  socket.on('joinFacilityRoom', (facilityId) => {
    socket.join(`facility_${facilityId}`);
    console.log(`Socket ${socket.id} joined facility_${facilityId}`);
  });
  
  socket.on('joinOperatorRoom', (operatorId) => {
    socket.join(`operator_${operatorId}`);
  });
  
  socket.on('joinIncidentRoom', (incidentId) => {
    socket.join(`incident_${incidentId}`);
  });
  
  socket.on('joinReferralRoom', (referralId) => {
    socket.join(`referral_${referralId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/followups', followUpRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), uptime: process.uptime() });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'RapidCare API Server',
    version: '2.0.0',
    description: 'AI-Powered Care Continuity & Emergency Response Platform',
    endpoints: [
      '/api/auth/register',
      '/api/auth/login',
      '/api/patients',
      '/api/referrals',
      '/api/facilities',
      '/api/followups',
      '/api/incidents'
    ]
  });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rapidcare';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
