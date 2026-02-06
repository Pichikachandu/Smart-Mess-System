const express = require('express');
const router = express.Router();
const { protect, supervisor } = require('../middleware/authMiddleware');
const { validateMeal, setMealSession, getMealSession } = require('../controllers/supervisorController');

router.post('/scan', protect, supervisor, validateMeal);
router.post('/session', protect, supervisor, setMealSession);
router.get('/session', protect, supervisor, getMealSession);

module.exports = router;
