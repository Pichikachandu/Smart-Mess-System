const mongoose = require('mongoose');

const tokenSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    qrPayload: { type: String, required: true },
    mealType: { type: String, enum: ['BREAKFAST', 'LUNCH', 'DINNER'], required: true },
    expiresAt: { type: Date, required: true },
    refreshedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const Token = mongoose.model('Token', tokenSchema);
module.exports = Token;
