const mongoose = require('mongoose');

const mealSessionSchema = mongoose.Schema({
    mealType: {
        type: String,
        enum: ['BREAKFAST', 'LUNCH', 'DINNER'],
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    supervisorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const MealSession = mongoose.model('MealSession', mealSessionSchema);
module.exports = MealSession;
