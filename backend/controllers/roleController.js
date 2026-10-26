const Role = require('../models/Role');

exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const role = new Role({
      name,
      description,
      permissions: permissions || [],
    });

    await role.save();
    res.status(201).json({ message: 'Role created successfully', role });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create role', error: error.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find({ isActive: true });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch roles', error: error.message });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch role', error: error.message });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, description, permissions },
      { new: true, runValidators: true }
    );
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json({ message: 'Role updated successfully', role });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update role', error: error.message });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }

    const roleName = role.name;

    // Hard delete or deactivate the role
    await Role.findByIdAndDelete(req.params.id);

    // Reassign any users who had this role back to default 'User' role
    const User = require('../models/User');
    const updateResult = await User.updateMany(
      { role: { $regex: new RegExp(`^${roleName}$`, 'i') } },
      { $set: { role: 'User' } }
    );

    res.json({
      message: `Role "${roleName}" deleted successfully. ${updateResult.modifiedCount} user(s) reassigned to "User" role.`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete role', error: error.message });
  }
};
