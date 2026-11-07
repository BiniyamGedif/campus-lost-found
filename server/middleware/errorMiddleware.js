// middleware/errorMiddleware.js
// Centralized error handling for the Express API.
// Instead of handling errors inside every controller, we throw errors
// (or call next(err)) and let these handlers format the response.

// notFound - catches requests to routes that do not exist.
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// errorHandler - formats any error into a consistent JSON response.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // If a controller set a status code, use it; otherwise default to 500.
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    // Only expose the stack trace in development.
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
