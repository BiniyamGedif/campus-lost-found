// controllers/authController.js
// Authentication controller: register, login, logout, get current user,
// email verification, and resend verification.

const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

const isAllowedEmailDomain = (email) => {
  const raw = process.env.UNIVERSITY_EMAIL_DOMAINS || '';
  const domains = raw
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  if (domains.length === 0) return true;

  const domain = email.split('@')[1]?.toLowerCase();
  return domains.includes(domain);
};

// Helper to build the verification URL and send the email.
// Email sending is best-effort: failures are logged but do not crash registration.
const sendVerificationEmail = async (user, rawToken) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verifyUrl = `${clientUrl}/verify-email?token=${rawToken}`;

  const message = `Please verify your email by clicking the following link:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`;

  // In development, log the link so testing is possible without SMTP.
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Verification link for ${user.email}: ${verifyUrl}`);
  }

  try {
    await sendEmail({
      to: user.email,
      subject: 'Campus Lost and Found - Verify your email',
      text: message,
      html: `<p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error.message);
  }
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

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.create({
      name,
      email,
      password,
      verificationToken: hashedToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    await sendVerificationEmail(user, rawToken);

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
// @access  Public
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

// @desc    Verify email using token
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400);
      throw new Error('Verification token is required');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    }).select('+verificationToken +verificationTokenExpires');

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired verification token');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+verificationToken +verificationTokenExpires'
    );

    if (!user) {
      // Do not reveal whether the email exists.
      res.status(200).json({
        success: true,
        message: 'If an account exists, a verification email has been sent.',
      });
      return;
    }

    if (user.isVerified) {
      res.status(400);
      throw new Error('Email is already verified');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.verificationToken = hashedToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(user, rawToken);

    res.status(200).json({
      success: true,
      message: 'If an account exists, a verification email has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
};
