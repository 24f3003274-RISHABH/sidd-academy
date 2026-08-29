import { AppError } from '../utils/apiResponse.js';
import ENV from '../config/env.js';

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }
  if (err.code === '23505' || err.code === 11000) {
    message = 'A record with these details already exists.';
    statusCode = 400;
  }
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors || {}).map(val => val.message).join(', ');
    statusCode = 400;
  }
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token. Please log in again.';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Your session has expired. Please log in again.';
    statusCode = 401;
  }

  // Sanitize message in production to prevent leaking sensitive DB credentials or table details
  const isProd = (process.env.NODE_ENV || ENV.NODE_ENV) === 'production';
  if (isProd && statusCode >= 500) {
    message = 'An internal server error occurred. Please try again later.';
  } else if (typeof message === 'string') {
    // Strip connection string credentials or keys if present in error message
    message = message.replace(/postgresql:\/\/[^@]+@/gi, 'postgresql://***:***@');
  }

  if (!isProd) {
    console.error('ERROR STACK:', err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(!isProd && { stack: err.stack }),
  });
};

