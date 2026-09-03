import rateLimit from 'express-rate-limit';

/**
 * Standard General API Rate Limiter
 * 300 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Strict Authentication Rate Limiter
 * 20 attempts per 15 minutes per IP to prevent brute-force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

/**
 * Payment Verification Rate Limiter
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many payment requests. Please try again later.',
  },
});

/**
 * OTP Request & Resend Rate Limiter
 * Maximum 10 requests per 15 minutes per IP
 * Protects SMS/Email quotas and prevents flooding
 */
export const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP dispatch requests. Please try again after 15 minutes.',
  },
});

/**
 * OTP Verification Rate Limiter
 * Maximum 20 verification attempts per 15 minutes per IP
 * Protects against automated OTP enumeration / brute force
 */
export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP verification attempts. Please try again after 15 minutes.',
  },
});

