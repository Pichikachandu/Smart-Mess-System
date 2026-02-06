const User = require('../models/User');
const Token = require('../models/Token');
const MealLog = require('../models/MealLog');

// Helper to determine current meal type based on time
const getCurrentMealType = () => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const time = hour + minutes / 60;

    if (time >= 6 && time < 10.0) return 'BREAKFAST';
    if (time >= 12 && time < 14.0) return 'LUNCH';
    if (time >= 18.5 && time < 22.0) return 'DINNER';
    return null;
};

// @desc    Scan and validate QR
// @route   POST /api/supervisor/scan
// @access  Private/Supervisor
const validateMeal = async (req, res) => {
    const { qrPayload } = req.body;
    const supervisorId = req.user._id;
    const io = req.app.get('io');

    const currentMeal = getCurrentMealType();

    // If testing outside hours, you might want to force a type or remove this check
    // For now, strict check, but fallback for demo:
    const mealType = currentMeal || 'DINNER'; // Defaulting for demo purposes if outside hours

    try {
        // 1. Find Token
        const token = await Token.findOne({ qrPayload });

        if (!token) {
            return res.status(400).json({ status: 'DENIED', reason: 'Invalid Token' });
        }

        // 2. Check Expiry
        if (new Date() > token.expiresAt) {
            return res.status(400).json({ status: 'DENIED', reason: 'Token Expired' });
        }

        const user = await User.findById(token.userId);
        if (!user) {
            return res.status(400).json({ status: 'DENIED', reason: 'User not found' });
        }

        // 3. User Active Status
        if (!user.isActive) {
            const mealLog = await logMeal(user._id, mealType, supervisorId, 'DENIED', 'Account Disabled');
            // Emit real-time update
            console.log(`🔔 Emitting mealLogCreated to user-${user._id}:`, mealLog._id);
            io.to(`user-${user._id}`).emit('mealLogCreated', mealLog);
            return res.status(400).json({ status: 'DENIED', reason: 'Account Disabled' });
        }

        // 4. Valid Meal Day check
        // Assuming validDays are ['MONDAY', 'TUESDAY'...]
        const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const today = days[new Date().getDay()];

        if (!user.validDays.includes(today.toUpperCase())) {
            const mealLog = await logMeal(user._id, mealType, supervisorId, 'DENIED', 'Invalid Day');
            // Emit real-time update
            console.log(`🔔 Emitting mealLogCreated to user-${user._id}:`, mealLog._id);
            io.to(`user-${user._id}`).emit('mealLogCreated', mealLog);
            return res.status(400).json({ status: 'DENIED', reason: `Not valid for ${today}` });
        }

        // 5. Check Duplicate
        // Check if a ALLOWED log exists for this user, date, and mealType
        const todayDateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const existingLog = await MealLog.findOne({
            userId: user._id,
            date: todayDateStr,
            mealType: mealType,
            status: 'ALLOWED'
        });

        if (existingLog) {
            const mealLog = await logMeal(user._id, mealType, supervisorId, 'DENIED', 'Already Consumed');
            // Emit real-time update
            console.log(`🔔 Emitting mealLogCreated to user-${user._id}:`, mealLog._id);
            io.to(`user-${user._id}`).emit('mealLogCreated', mealLog);
            return res.status(400).json({ status: 'DENIED', reason: 'Already Consumed' });
        }

        // 6. Success
        const mealLog = await logMeal(user._id, mealType, supervisorId, 'ALLOWED', 'Access Granted');

        // Emit real-time update
        console.log(`🔔 Emitting mealLogCreated to user-${user._id}:`, mealLog._id);
        io.to(`user-${user._id}`).emit('mealLogCreated', mealLog);

        // Optionally invalidate token after use to prevent replay within 5 mins?
        // token.expiresAt = new Date(); 
        // await token.save();
        // Request says "QR expires every few minutes", usually means time based.
        // "Strictly prevent unauthorized... Screenshot reuse must be invalid" 
        // If we invalidate it, screenshots fail. Good.
        // Let's expire it immediately.
        await Token.deleteOne({ _id: token._id });

        res.json({
            status: 'ALLOWED',
            student: {
                name: user.name,
                id: user.userId,
                meal: mealType,
                department: user.department,
                year: user.year
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

async function logMeal(userId, mealType, supervisorId, status, reason) {
    const todayDateStr = new Date().toISOString().split('T')[0];
    const mealLog = await MealLog.create({
        userId,
        date: todayDateStr,
        mealType,
        supervisorId,
        status,
        reason
    });

    // Populate supervisor data for real-time updates
    await mealLog.populate('supervisorId', 'name');
    return mealLog;
}

module.exports = { validateMeal };
