const express = require('express');
const router = express.Router();
const { 
  listHospitals, 
  updateAvailability, 
  getHospitalIncidents 
} = require('../controllers/hospitalController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// List hospitals (public or authenticated - for now, let's make it public for initial data)
router.get('/', listHospitals);

// Update hospital availability (hospital staff only)
router.patch('/:id/availability', 
  authMiddleware, 
  roleMiddleware(['hospital_staff']), 
  updateAvailability
);

// Get hospital incidents (hospital staff only)
router.get('/:id/incidents',
  authMiddleware,
  roleMiddleware(['hospital_staff']),
  getHospitalIncidents
);

module.exports = router;