const User = require('../models/User');
const Token = require('../models/Token');
const MealLog = require('../models/MealLog');
const crypto = require('crypto');

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private/Student
const getProfile = async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
};

// @desc    Generate a dynamic Qr Token
// @route   GET /api/student/generate-qr
// @access  Private/Student
const generateQrToken = async (req, res) => {
    try {
        // Get meal type from query parameter
        const { mealType } = req.query;
        
        // Validate meal type
        if (!mealType || !['BREAKFAST', 'LUNCH', 'DINNER'].includes(mealType)) {
            return res.status(400).json({ message: 'Valid meal type is required' });
        }

        // Generate a secure random string
        const payload = crypto.randomBytes(32).toString('hex');

        // Set expiry (e.g., 5 minutes)
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Create token with meal type
        await Token.create({
            userId: req.user._id,
            qrPayload: payload,
            mealType,
            expiresAt
        });

        res.json({ payload, expiresAt, mealType });
    } catch (error) {
        console.error('Error generating QR token:', error);
        res.status(500).json({ message: 'Failed to generate QR token' });
    }
};

// @desc    Get meal history
// @route   GET /api/student/history
// @access  Private/Student
const getMealHistory = async (req, res) => {
    const history = await MealLog.find({ userId: req.user._id })
        .populate('supervisorId', 'name')
        .sort({ timestamp: -1 });
    res.json(history);
};

module.exports = { getProfile, generateQrToken, getMealHistory };
