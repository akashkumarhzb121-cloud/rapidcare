const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const patientService = require('../services/patientService');

// All routes require authentication
router.use(authMiddleware);

// Register new patient (CHW or Operator)
router.post('/', roleMiddleware(['community_health_worker', 'ambulance_operator']), async (req, res) => {
  try {
    const patient = await patientService.registerPatient(
      req.body,
      req.userId,
      req.user.linkedFacilityId
    );
    res.status(201).json({ message: 'Patient registered successfully', patient });
  } catch (error) {
    console.error('Patient registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Search patients
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const patients = await patientService.searchPatients(q);
    res.json({ patients });
  } catch (error) {
    console.error('Patient search error:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

// Get patient history
router.get('/:id/history', async (req, res) => {
  try {
    const history = await patientService.getPatientHistory(req.params.id);
    res.json(history);
  } catch (error) {
    console.error('Patient history error:', error);
    res.status(404).json({ error: error.message });
  }
});

module.exports = router;
