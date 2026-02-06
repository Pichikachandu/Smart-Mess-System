const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const importData = async () => {
    try {
        await User.deleteMany();

        const adminUser = new User({
            userId: 'ADMIN001',
            name: 'System Admin',
            role: 'ADMIN',
            password: 'chandu0410',
            isActive: true
        });

        await adminUser.save();

        const supervisorUser = new User({
            userId: 'SUP001',
            name: 'Dining Supervisor',
            role: 'SUPERVISOR',
            password: 'password123',
            isActive: true
        });
        await supervisorUser.save();

        const studentUser = new User({
            userId: 'STU001',
            name: 'Test Student',
            role: 'STUDENT',
            password: 'password123',
            isActive: true,
            department: 'CSE',
            year: '3',
            residentType: 'HOSTELER',
            mealType: 'NON_VEG'
        });
        await studentUser.save();

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
