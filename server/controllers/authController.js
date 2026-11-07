// controllers/authController.js
// Authentication controller: register, login, logout, get current user.

const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// Helper: check if the email domain is allowed by UNIVERSITY_EMAIL_DOMAINS.
const isAllowedEmailDomain = (email) => {
  const raw = process.env.UNIVERSITY_EMAIL_DOMAINS || '';
  const domains = raw
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  // If no domains configured, allow any email.
  if (domains.length === 0) return true;

  const domain = email.split('@')[1]?.toLowerCase();
  return domains.includes(domain);
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    if (!isAllowedEmailDomain(email)) {
      res.status(400);
      throw new Error('Email domain is not allowed for registration');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    // Generate a verification token (stored hashed). Email sending is Phase 7.
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const user = await User.create({
      name,
      email,
      password,
      verificationToken: hashedToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Do not issue a login token here; verification required (Phase 7).
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Select password explicitly since it's excluded by default.
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (user.isDisabled) {
      res.status(403);
      throw new Error('Account is disabled');
    }

    generateToken(res, user._id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user (clear cookie)
// @route   POST /api/auth/logout
// @access  Public (clears cookie if present)
const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isVerified: req.user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe };
