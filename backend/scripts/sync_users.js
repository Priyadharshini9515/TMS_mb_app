require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const connectDB = require('../config/database');

async function syncUsers() {
  try {
    await connectDB();

    const hashedPassword123 = await bcrypt.hash('123', 10);
    const hashedSuperAdmin = await bcrypt.hash('SuperAdmin@123', 10);

    const defaultRoles = [
      { name: 'SuperAdmin', description: 'System Super Administrator', permissions: ['all'] },
      { name: 'User', description: 'Regular Staff / Student', permissions: ['create_complaint', 'view_my_complaints'] },
      { name: 'Networking Staff', description: 'Network & Internet technician', permissions: ['view_complaints', 'update_status'] },
      { name: 'Electrician', description: 'Electrical maintenance', permissions: ['view_complaints', 'update_status'] },
      { name: 'Plumber', description: 'Plumbing maintenance', permissions: ['view_complaints', 'update_status'] },
      { name: 'Software Developer', description: 'Software & IT issues', permissions: ['view_complaints', 'update_status'] },
    ];

    for (const r of defaultRoles) {
      await Role.findOneAndUpdate(
        { name: r.name },
        { ...r, isActive: true },
        { upsert: true, new: true }
      );
    }
    console.log('Roles synced successfully.');

    const defaultUsers = [
      {
        username: 'superadmin_official',
        email: 'superadmin@example.com',
        phone: '9876543210',
        password: hashedSuperAdmin,
        role: 'SuperAdmin',
        isActive: true,
      },
      {
        username: 'admin_gmail',
        email: 'admin@gmail.com',
        phone: '9876543211',
        password: hashedPassword123,
        role: 'SuperAdmin',
        isActive: true,
      },
      {
        username: 'regular_user',
        email: 'user1@example.com',
        phone: '9876543212',
        password: hashedPassword123,
        role: 'User',
        isActive: true,
      },
      {
        username: 'user_gmail',
        email: 'user@gmail.com',
        phone: '9876543213',
        password: hashedPassword123,
        role: 'User',
        isActive: true,
      },
      {
        username: 'user_example',
        email: 'user@example.com',
        phone: '9876543214',
        password: hashedPassword123,
        role: 'User',
        isActive: true,
      },
      {
        username: 'plumber_staff',
        email: 'plumber@gmail.com',
        phone: '9876543215',
        password: hashedPassword123,
        role: 'Plumber',
        isActive: true,
      },
      {
        username: 'plumber_example',
        email: 'plumber1@example.com',
        phone: '9876543216',
        password: hashedPassword123,
        role: 'Plumber',
        isActive: true,
      },
      {
        username: 'electrician_staff',
        email: 'electrician@gmail.com',
        phone: '9876543217',
        password: hashedPassword123,
        role: 'Electrician',
        isActive: true,
      },
      {
        username: 'electrician_example',
        email: 'electrician1@example.com',
        phone: '9876543218',
        password: hashedPassword123,
        role: 'Electrician',
        isActive: true,
      },
      {
        username: 'network_staff',
        email: 'network1@example.com',
        phone: '9876543219',
        password: hashedPassword123,
        role: 'Networking Staff',
        isActive: true,
      },
      {
        username: 'software_staff',
        email: 'software1@example.com',
        phone: '9876543220',
        password: hashedPassword123,
        role: 'Software Developer',
        isActive: true,
      },
    ];

    for (const u of defaultUsers) {
      await User.findOneAndUpdate(
        { email: u.email },
        { ...u },
        { upsert: true, new: true }
      );
      console.log(`Synced user: ${u.email} (${u.role})`);
    }

    // Activate any other existing users in the database
    await User.updateMany({}, { $set: { isActive: true } });

    console.log('All users activated and verified!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error syncing users:', err);
    process.exit(1);
  }
}

syncUsers();
