const mongoose = require('mongoose');

const mealLogSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    mealType: { type: String, enum: ['BREAKFAST', 'LUNCH', 'DINNER'], required: true },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['ALLOWED', 'DENIED'], required: true },
    reason: { type: String }, // 'Fee not paid', 'Expired', 'Already consumed', etc.
    timestamp: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const MealLog = mongoose.model('MealLog', mealLogSchema);
module.exports = MealLog;
