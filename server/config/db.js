// config/db.js
// Handles connecting Mongoose to the local MongoDB instance.
// Mongoose is an ODM (Object Data Modeling) library that lets us
// define schemas and interact with MongoDB using JavaScript objects.

const mongoose = require('mongoose');

/**
 * connectDB - Establishes a connection to MongoDB.
 *
 * We read the connection string from the MONGO_URI environment variable.
 * If it is not set, we fall back to the local default for development.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_lost_found';

    // mongoose.connect returns a promise that resolves when connected.
    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    // If the connection fails, log the error and exit the process.
    // There is no point running the API without a database.
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
