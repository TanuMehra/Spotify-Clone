const ApiError = require('../utils/ApiError');

/**
 * Enterprise Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // 1. If the error is not an instance of our custom ApiError, standardize it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, err.errors || [], err.stack);
  }

  // 2. Handle specific DB casting issues (e.g. invalid ObjectId format)
  if (error.stack && error.stack.includes('CastError')) {
    error.statusCode = 404;
    error.message = 'Resource not found: Invalid ID format';
  }

  // 3. Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error.statusCode = 400;
    error.message = 'Database Validation Error';
    error.errors = messages;
  }

  // 4. Handle Mongoose unique key conflicts
  if (err.code === 11000) {
    error.statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);
    error.message = `${capitalizedField} is already registered. Please try another one.`;
  }

  // 5. Structure payload response
  const response = {
    success: false,
    message: error.message,
    errors: error.errors,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }), // only expose stack in dev
  };

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;
