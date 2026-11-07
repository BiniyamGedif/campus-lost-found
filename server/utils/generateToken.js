// utils/generateToken.js
// Creates a signed JWT for the given user and sets it as an HTTP-only cookie.
// HTTP-only cookies cannot be read by JavaScript, protecting the token from XSS.

const jwt = require('jsonwebtoken');

const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const isProduction = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';

  res.cookie('token', token, {
    httpOnly: true, // not accessible via JavaScript
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax', // CSRF mitigation
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  return token;
};

module.exports = generateToken;
