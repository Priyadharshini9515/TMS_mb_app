require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  const users = await User.find({}, 'username email role password').lean();
  console.log('Total users: ' + users.length);
  users.forEach(u => {
    const hasPwd = u.password ? 'YES' : 'NO (no password set!)';
    console.log('email: ' + u.email + ' | username: ' + u.username + ' | role: ' + u.role + ' | hasPassword: ' + hasPwd);
  });
  mongoose.disconnect();
}).catch(e => console.error('DB Error:', e.message));
