// routes/authRoutes.js
// Authentication routes.

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const { validationResult } = require('express-validator');
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return next(new Error(errors.array()[0].msg));
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, handleValidation, register);
router.post('/login', loginValidation, handleValidation, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

module.exports = router;
