// server.js - Entry point for the Campus Lost and Found backend API.

// Load environment variables from .env into process.env FIRST,
// before any other module reads them.
require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');

// Connect to the local MongoDB database.
connectDB();

// Create the Express application instance.
const app = express();

// Basic middleware to parse JSON request bodies.
app.use(express.json());

// Simple health-check route so we can verify the server is running.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Campus Lost and Found API is running',
  });
});

// Use PORT from environment or default to 5000.
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
