const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // Student ID or Admin/Staff ID
    name: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'STUDENT', 'SUPERVISOR'], required: true },
    department: { type: String, enum: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI&DS', 'AIML', 'CS'] }, // Student Dept
    year: { type: String, enum: ['1', '2', '3', '4'] }, // Only for students
    residentType: { type: String, enum: ['HOSTELER', 'DAY_SCHOLAR'] },
    mealType: { type: String, enum: ['VEG', 'NON_VEG'] },
    validDays: { type: [String], default: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] },
    isActive: { type: Boolean, default: true },
    password: { type: String, required: true },
}, {
    timestamps: true
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
