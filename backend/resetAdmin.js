const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function verifyAndReset() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const users = await User.find({}, 'username email role');
        console.log('--- ALL USERS ---');
        users.forEach(u => {
            console.log(`Email: ${u.email} | Username: ${u.username} | Role: ${u.role}`);
        });

        const adminEmail = 'admin@example.com';
        const newPassword = 'Admin@123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const result = await User.updateOne(
            { email: adminEmail },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount > 0) {
            console.log(`\nSUCCESS: Password for ${adminEmail} has been reset to: ${newPassword}`);
        } else {
            console.log(`\nERROR: User ${adminEmail} not found!`);
        }

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

verifyAndReset();
