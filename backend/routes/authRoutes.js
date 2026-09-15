const express = require('express');
const router = express.Router();
const { register, login, updateLanguage } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.patch('/language', authMiddleware, updateLanguage);

module.exports = router;
