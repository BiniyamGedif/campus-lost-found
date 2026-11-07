// server.js - Entry point for the Campus Lost and Found backend API.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Connect to the local MongoDB database.
connectDB();

const app = express();

// Security headers.
app.use(helmet());

// Logging in development.
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// CORS: allow the frontend origin to send cookies/credentials.
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Parse JSON and URL-encoded bodies.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse cookies (needed for JWT auth cookies later).
app.use(cookieParser());

// Basic rate limiting for all API routes.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

// Health check route.
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Campus Lost and Found API is running' });
});

// Mount route modules.
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for unknown routes.
app.use(notFound);

// Centralized error handler (must be last).
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
