const express = require('express');
const router = express.Router();
const { 
  createIncident, 
  getIncident, 
  getFacilityIncidents,
  dispatchIncident, 
  acknowledgeIncident,
  rejectIncident,
  completeIncident 
} = require('../controllers/incidentController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Operator only
router.post('/', roleMiddleware(['ambulance_operator']), createIncident);
router.patch('/:id/dispatch', roleMiddleware(['ambulance_operator']), dispatchIncident);

// Staff only — verification workflow
router.patch('/:id/acknowledge', roleMiddleware(['hospital_staff']), acknowledgeIncident);
router.patch('/:id/reject', roleMiddleware(['hospital_staff']), rejectIncident);
router.patch('/:id/complete', roleMiddleware(['hospital_staff']), completeIncident);

// Read — any authenticated user
router.get('/facility/:facilityId', getFacilityIncidents);
router.get('/:id', getIncident);

module.exports = router;
