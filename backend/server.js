const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  'https://rapidcare108.vercel.app',
  'http://localhost:3000'
];

const io = socketIO(server, {
  cors: { origin: allowedOrigins, methods: ['GET','POST','PATCH','PUT','DELETE'], credentials: true }
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.set('io', io);

const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const patientRoutes = require('./routes/patientRoutes');
const referralRoutes = require('./routes/referralRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const followUpRoutes = require('./routes/followUpRoutes');
const teleconsultRoutes = require('./routes/teleconsultRoutes');
const queueRoutes = require('./routes/queueRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const diagnosticRoutes = require('./routes/diagnosticRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('joinHospitalRoom', (id) => { socket.join(`hospital_${id}`); socket.join(`facility_${id}`); });
  socket.on('joinFacilityRoom', (id) => socket.join(`facility_${id}`));
  socket.on('joinOperatorRoom', (id) => socket.join(`operator_${id}`));
  socket.on('joinIncidentRoom', (id) => socket.join(`incident_${id}`));
  socket.on('joinUserRoom', (id) => socket.join(`user_${id}`));
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/teleconsults', teleconsultRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/diagnostics', diagnosticRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date(), uptime: process.uptime() }));

app.get('/', (req, res) => res.json({
  message: 'RapidCare API Server',
  version: '2.3.0',
  features: ['patients','referrals','incidents','facilities','followups','teleconsults','queue','appointments','diagnostics','analytics']
}));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rapidcare';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
