// middleware/authMiddleware.js
// Protects routes by verifying the JWT stored in the HTTP-only cookie.
// Attaches the authenticated user to req.user (without password).

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// protect - requires a valid logged-in user.
const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.status(401);
      throw new Error('Not authorized, no token');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    if (user.isDisabled) {
      res.status(403);
      throw new Error('Account is disabled');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(res.statusCode === 200 ? 401 : res.statusCode);
    next(error);
  }
};

// adminOnly - requires the authenticated user to be an admin.
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403);
  next(new Error('Not authorized as an administrator'));
};

module.exports = { protect, adminOnly };
