// server/controllers/authController.js
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

// Helper to set auth cookie
function setAuthCookie(res, token) {
  // HttpOnly cookie, sameSite lax, expires in 7 days
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // In production you should set secure: true
  });
}

// @desc   Register new user
// @route  POST /api/auth/register
// @access Public
async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields required' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const user = await User.create({ name, email, passwordHash });
    const token = signToken(user._id);
    setAuthCookie(res, token);
    res.status(201).json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// @desc   Login existing user
// @route  POST /api/auth/login
// @access Public
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = signToken(user._id);
    setAuthCookie(res, token);
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// @desc   Logout user
// @route  POST /api/auth/logout
// @access Private (but works without auth as well)
function logout(req, res) {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out' });
}

// @desc   Get current user info
// @route  GET /api/auth/me
// @access Private
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { register, login, logout, getMe };
