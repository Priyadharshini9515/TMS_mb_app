const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/tms_test');
  const h123 = await bcrypt.hash('123', 10);
  const hAdmin = await bcrypt.hash('SuperAdmin@123', 10);

  // Update superadmin
  await User.findOneAndUpdate(
    { email: 'superadmin@example.com' },
    { $set: { password: hAdmin, isActive: true, role: 'SuperAdmin' } },
    { upsert: true }
  );

  // Update admin@gmail.com
  await User.findOneAndUpdate(
    { email: 'admin@gmail.com' },
    { $set: { password: h123, username: 'admin', phone: '9876543211', isActive: true, role: 'SuperAdmin' } },
    { upsert: true }
  );

  // Update all other users to password 123 and isActive true
  const users = await User.find({});
  for (const u of users) {
    if (u.email !== 'superadmin@example.com' && u.email !== 'admin@gmail.com') {
      u.password = h123;
      u.isActive = true;
      await u.save();
    }
  }

  console.log('Successfully activated all users in local DB with password 123!');
  const all = await User.find({}, 'email role isActive');
  console.log('All users:');
  console.log(all);
  await mongoose.disconnect();
}

main().catch(console.error);
