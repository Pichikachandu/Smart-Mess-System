const User = require('../models/User');

// @desc    Register a new user (Student or Supervisor)
// @route   POST /api/admin/users
// @access  Private/Admin
const registerUser = async (req, res) => {
    try {
        const { userId, name, role, department, year, residentType, mealType, validDays, password } = req.body;

        const userExists = await User.findOne({ userId });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const userData = {
            userId,
            name,
            role,
            password
        };

        // Only add student fields if role is STUDENT
        if (role === 'STUDENT') {
            userData.year = year;
            userData.department = department;
            userData.residentType = residentType;
            userData.mealType = mealType;
            userData.validDays = validDays;
        }

        const user = await User.create(userData);

        if (user) {
            res.status(201).json({
                _id: user._id,
                userId: user.userId,
                name: user.name,
                role: user.role
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Register User Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    const users = await User.find({}).select('-password');
    res.json(users);
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.isActive = req.body.isActive;
        const updatedUser = await user.save();
        res.json(updatedUser);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get all meal logs
// @route   GET /api/admin/logs
// @access  Private/Admin
const getLogs = async (req, res) => {
    const logs = await require('../models/MealLog').find({}).populate('userId', 'name userId').sort({ timestamp: -1 });
    res.json(logs);
};

// @desc    Get logs for a specific user
// @route   GET /api/admin/logs/:userId
// @access  Private/Admin
const getUserLogs = async (req, res) => {
    try {
        const logs = await require('../models/MealLog').find({ userId: req.params.userId }).populate('userId', 'name userId').sort({ timestamp: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, getUsers, updateUserStatus, getLogs, getUserLogs };
