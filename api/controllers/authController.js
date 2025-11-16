// api/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // 2. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create a new user object
    const newUser = {
      ...req.body,
      password: hashedPassword,
    };
    
    // 4. Save the new user
    const createdUser = await User.create(newUser);

    // 5. Respond (don't send back password)
    const { password: _, ...userForResponse } = createdUser;
    res.status(201).json({ success: true, message: 'User registered successfully!', user: userForResponse });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 2. Check if account is disabled
    if (user.disabled) {
        return res.status(403).json({ success: false, message: 'Account is disabled. Please contact an administrator.' });
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // 4. Create JWT Payload
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };
    
    // 5. Sign the token
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // 6. Respond with token and user info (excluding password)
    const { password: _, ...userForResponse } = user;
    res.json({
      success: true,
      token,
      user: userForResponse,
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};
