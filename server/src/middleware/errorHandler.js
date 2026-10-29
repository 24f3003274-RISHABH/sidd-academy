import { AppError } from '../utils/apiResponse.js';
import ENV from '../config/env.js';

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

export const errorHandler = (err, req, res, next) => {
  // Razorpay SDK (and other third-party SDKs) throw plain objects, not Error subclasses.
  // They carry statusCode / status from the upstream HTTP response (e.g. Razorpay auth → 401).
  // We must NEVER forward an upstream 4xx as our own authentication error.
  // Anything that is not an explicitly set AppError gets capped at 500/502.
  const isAppError = err && err.isOperational === true; // AppError sets isOperational
  let rawStatus = err.statusCode || err.status || 500;

  // Cap upstream gateway/library error codes so they never masquerade as auth failures
  let statusCode = rawStatus;
  if (!isAppError && rawStatus >= 400 && rawStatus < 600) {
    statusCode = rawStatus >= 500 ? 500 : 502; // upstream 4xx → 502 Bad Gateway
  }
  if (statusCode < 400 || statusCode > 599) {
    statusCode = 500; // sanity guard
  }

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

