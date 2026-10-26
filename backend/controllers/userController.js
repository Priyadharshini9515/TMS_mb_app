const User = require('../models/User');

exports.createUser = async (req, res) => {
  try {
    const { username, email, phone, password, role, department, programme } = req.body;

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      username,
      email,
      phone,
      password: hashedPassword,
      role,
    };
    if (department && department !== '') userData.department = department;
    if (programme && programme !== '') userData.programme = programme;

    const user = new User(userData);
    await user.save();
    
    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ message: 'User created successfully', user: userObj });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { role, department } = req.query;
    const query = { isActive: true };
    if (role) query.role = role;
    if (department) query.department = department;

    const users = await User.find(query)
      .select('-password')
      .populate('department')
      .populate('programme');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('department')
      .populate('programme');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { username, email, phone, role, department, programme } = req.body;
    const updateData = { username, email, phone, role };
    updateData.department = (department && department !== '') ? department : null;
    updateData.programme = (programme && programme !== '') ? programme : null;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};
