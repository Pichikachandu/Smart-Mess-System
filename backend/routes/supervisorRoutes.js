const express = require('express');
const router = express.Router();
const { protect, supervisor } = require('../middleware/authMiddleware');
const { validateMeal } = require('../controllers/supervisorController');

router.post('/scan', protect, supervisor, validateMeal);

module.exports = router;
