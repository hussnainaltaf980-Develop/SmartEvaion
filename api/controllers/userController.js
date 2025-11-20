const User = require('../models/user.js');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    const usersWithoutPasswords = users.map(u => {
      const { password, ...user } = u;
      return user;
    });
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.createUser = async (req, res) => {
  try {
     const { email, password, name, role } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = { ...req.body, password: hashedPassword };
    const createdUser = await User.create(newUser);
    
    const { password: _, ...userForResponse } = createdUser;
    res.status(201).json({ success: true, message: 'User created successfully', user: userForResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateUserProfile = async (req, res) => {
  const { id } = req.params;
  if (req.user.id !== id && req.user.role !== 'super-admin' && req.user.role !== 'content-manager') {
    return res.status(403).json({ success: false, message: 'Not authorized to update this user' });
  }

  try {
    const updatedUser = await User.update(id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { password, ...userForResponse } = updatedUser;
    res.json({ success: true, message: 'Profile updated successfully', user: userForResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const updatedUser = await User.update(req.params.id, { disabled: !user.disabled });
    const { password, ...userForResponse } = updatedUser;
    res.json({ success: true, message: 'User status updated', user: userForResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { newRole } = req.body;
        if (!['candidate', 'content-manager', 'super-admin'].includes(newRole)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified' });
        }
        const updatedUser = await User.update(req.params.id, { role: newRole });
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const { password, ...userForResponse } = updatedUser;
        res.json({ success: true, message: 'User role updated', user: userForResponse });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};