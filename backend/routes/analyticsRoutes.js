const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const analyticsService = require('../services/analyticsService');

router.use(authMiddleware);

// Facility map — accessible to admins and any authenticated user
router.get('/map', async (req, res) => {
  try {
    const data = await analyticsService.getFacilityMapData({
      district: req.query.district,
      facilityType: req.query.facilityType
    });
    res.json({ facilities: data });
  } catch (error) {
    console.error('Map data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// District admin only routes
router.get('/overview', roleMiddleware(['district_admin']), async (req, res) => {
  try {
    const data = await analyticsService.getDistrictOverview({ district: req.query.district });
    res.json(data);
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/referral-trend', roleMiddleware(['district_admin']), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const data = await analyticsService.getReferralTrend({ district: req.query.district }, days);
    res.json({ trend: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/emergency-distribution', roleMiddleware(['district_admin']), async (req, res) => {
  try {
    const data = await analyticsService.getEmergencyDistribution({ district: req.query.district });
    res.json({ distribution: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/severity-distribution', roleMiddleware(['district_admin']), async (req, res) => {
  try {
    const data = await analyticsService.getSeverityDistribution({ district: req.query.district });
    res.json({ distribution: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/medicine-shortages', roleMiddleware(['district_admin']), async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 500;
    const data = await analyticsService.getMedicineShortages({ district: req.query.district }, threshold);
    res.json({ shortages: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/facility-ranking', roleMiddleware(['district_admin']), async (req, res) => {
  try {
    const data = await analyticsService.getFacilityRanking({ district: req.query.district });
    res.json({ ranking: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/district-breakdown', roleMiddleware(['district_admin']), async (req, res) => {
  try {
    const data = await analyticsService.getDistrictBreakdown();
    res.json({ districts: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
