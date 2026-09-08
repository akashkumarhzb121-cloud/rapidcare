const express = require('express');
const router = express.Router();
const { 
  createIncident, 
  getIncident, 
  dispatchIncident, 
  completeIncident 
} = require('../controllers/incidentController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// All incident routes require authentication
router.use(authMiddleware);

// Create incident (operators only)
router.post('/', roleMiddleware(['ambulance_operator']), createIncident);

// Get incident details (any authenticated user)
router.get('/:id', getIncident);

// Dispatch incident (operators only)
router.patch('/:id/dispatch', roleMiddleware(['ambulance_operator']), dispatchIncident);

// Complete incident (hospital staff only)
router.patch('/:id/complete', roleMiddleware(['hospital_staff']), completeIncident);

module.exports = router;