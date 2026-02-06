const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const authUser = async (req, res) => {
    const { userId, password } = req.body;

    const user = await User.findOne({ userId });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            userId: user.userId,
            name: user.name,
            role: user.role,
            year: user.year, // Essential for Student Dashboard
            department: user.department,
            mealType: user.mealType, // Added for dashboard chips
            residentType: user.residentType,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid userId or password' });
    }
};

module.exports = { authUser };
