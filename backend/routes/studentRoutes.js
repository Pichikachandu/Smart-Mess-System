const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getProfile, generateQrToken, getMealHistory } = require('../controllers/studentController');

router.get('/profile', protect, getProfile);
router.get('/generate-qr', protect, generateQrToken);
router.get('/history', protect, getMealHistory);

module.exports = router;
