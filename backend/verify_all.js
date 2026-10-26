const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testAll() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = [
        { e: 'admin@gmail.com', p: '123' },
        { e: 'superadmin@example.com', p: 'SuperAdmin@123' }
    ];

    for (const u of users) {
        const user = await User.findOne({ email: u.e }).select('+password');
        if (user) {
            const match = await bcrypt.compare(u.p, user.password);
            console.log(`TEST ${u.e}: ${match ? 'PASS' : 'FAIL'}`);
        } else {
            console.log(`TEST ${u.e}: NOT FOUND`);
        }
    }
    mongoose.disconnect();
}

testAll();
