import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  registerValidator,
  loginValidator,
  verifyRegistrationValidator,
  forgotPasswordValidator,
  verifyResetOtpValidator,
  resetPasswordValidator,
  resendOtpValidator,
  sendMobileOtpValidator,
  verifyMobileOtpValidator,
} from '../validators/auth.validator.js';
import { validateRequest } from '../middleware/validate.middleware.js';
import { otpSendLimiter, otpVerifyLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Public Authentication & OTP Endpoints
 */

// POST /api/v1/auth/register - Initiate registration (dispatches OTP)
router.post(
  '/register',
  otpSendLimiter,
  registerValidator,
  validateRequest,
  authController.register
);

// POST /api/v1/auth/verify-registration-otp - Verify OTP and complete registration
router.post(
  '/verify-registration-otp',
  otpVerifyLimiter,
  verifyRegistrationValidator,
  validateRequest,
  authController.verifyRegistrationOtp
);
// Convenient alias
router.post(
  '/verify-otp',
  otpVerifyLimiter,
  verifyRegistrationValidator,
  validateRequest,
  authController.verifyRegistrationOtp
);

// POST /api/v1/auth/forgot-password - Step 1: Request password reset OTP (Enumeration Safe)
router.post(
  '/forgot-password',
  otpSendLimiter,
  forgotPasswordValidator,
  validateRequest,
  authController.forgotPassword
);

// POST /api/v1/auth/verify-reset-otp - Step 2: Verify reset OTP and obtain resetToken
router.post(
  '/verify-reset-otp',
  otpVerifyLimiter,
  verifyResetOtpValidator,
  validateRequest,
  authController.verifyResetOtp
);

// POST /api/v1/auth/reset-password - Step 3: Complete password reset with resetToken
router.post(
  '/reset-password',
  otpVerifyLimiter,
  resetPasswordValidator,
  validateRequest,
  authController.resetPassword
);

// POST /api/v1/auth/resend-otp - Resend verification OTP with cooldown check
router.post(
  '/resend-otp',
  otpSendLimiter,
  resendOtpValidator,
  validateRequest,
  authController.resendOtp
);

// POST /api/v1/auth/login - User login with email & password
router.post('/login', loginValidator, validateRequest, authController.login);

// POST /api/v1/auth/refresh-token - Refresh expired access token
router.post('/refresh-token', authController.refreshToken);

/**
 * Protected Authentication & Account Endpoints
 * All routes below require valid JWT Bearer token
 */
router.use(authenticate);

// GET /api/v1/auth/me - Current user identity and role
router.get('/me', authController.getMe);

// POST /api/v1/auth/logout - Invalidate session / clear cookies
router.post('/logout', authController.logout);

// PUT /api/v1/auth/profile - Update user profile information
router.put('/profile', authController.updateProfile);

// PUT /api/v1/auth/change-password - Change current password
router.put('/change-password', authController.changePassword);

// POST /api/v1/auth/send-mobile-otp - Send Indian mobile verification code
router.post(
  '/send-mobile-otp',
  otpSendLimiter,
  sendMobileOtpValidator,
  validateRequest,
  authController.sendMobileOtp
);

// POST /api/v1/auth/verify-mobile-otp - Verify Indian mobile code and mark phone_verified
router.post(
  '/verify-mobile-otp',
  otpVerifyLimiter,
  verifyMobileOtpValidator,
  validateRequest,
  authController.verifyMobileOtp
);

export default router;
