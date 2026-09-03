import { authService } from '../services/auth.service.js';
import { otpService } from '../services/otp.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { setRefreshTokenCookie } from '../utils/generateToken.js';

/**
 * Controller for Authentication & Identity endpoints
 * Enhanced with production-ready OTP verification and account recovery.
 */

/**
 * POST /api/v1/auth/register
 * Step 1 of Registration: Validates input, pre-hashes credentials, and dispatches verification OTP
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const result = await otpService.sendRegistrationOTP({ name, email, password, phone });

    const message = result.channel === 'sms'
      ? `Verification code sent to ${result.maskedPhone || 'your mobile number'}.`
      : 'Verification code sent to your email address.';

    return sendSuccess(res, 200, message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/verify-registration-otp
 * Step 2 of Registration: Verifies OTP, persists user record, and issues JWT tokens
 */
export const verifyRegistrationOtp = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body;
    const result = await otpService.verifyRegistrationOTP({ identifier, otp });

    if (result.refreshToken) {
      setRefreshTokenCookie(res, result.refreshToken);
    }

    return sendSuccess(res, 201, 'Account verified and created successfully.', {
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/forgot-password
 * Step 1 of Password Reset: Validates identifier and sends OTP
 * Enumeration-Safe: Never leaks account existence
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;
    const result = await otpService.sendForgotPasswordOTP({ identifier });

    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/verify-reset-otp
 * Step 2 of Password Reset: Verifies OTP and returns short-lived reset authorization token
 */
export const verifyResetOtp = async (req, res, next) => {
  try {
    const { identifier, otp } = req.body;
    const result = await otpService.verifyResetPasswordOTP({ identifier, otp });

    return sendSuccess(res, 200, result.message, {
      resetToken: result.resetToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/reset-password
 * Step 3 of Password Reset: Updates password using verified resetToken
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    const result = await otpService.resetPassword({ resetToken, newPassword });

    return sendSuccess(res, 200, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/resend-otp
 * Resend OTP with cooldown enforcement
 */
export const resendOtp = async (req, res, next) => {
  try {
    const { identifier, purpose } = req.body;
    const result = await otpService.resendOTP({ identifier, purpose });

    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/send-mobile-otp
 * Request Indian mobile verification OTP (Authenticated)
 */
export const sendMobileOtp = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { phone } = req.body;
    const result = await otpService.sendMobileVerificationOTP({ userId, phone });

    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/verify-mobile-otp
 * Complete Indian mobile verification (Authenticated)
 */
export const verifyMobileOtp = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { phone, otp } = req.body;
    const result = await otpService.verifyMobileVerificationOTP({ userId, phone, otp });

    return sendSuccess(res, 200, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 * Authenticate student or admin credentials
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    if (result.refreshToken) {
      setRefreshTokenCookie(res, result.refreshToken);
    }

    return sendSuccess(res, 200, 'Login successful', {
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/auth/me
 * Retrieve current authenticated user profile
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const userProfile = await authService.getMe(userId);

    return sendSuccess(res, 200, 'User profile fetched', {
      user: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 * Log out user and clear refresh cookies
 */
export const logout = async (req, res, next) => {
  try {
    res.clearCookie('refreshToken');
    res.clearCookie('token');
    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/auth/profile
 * Update profile details of authenticated user
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { name, phone, avatar } = req.body;
    const updatedUser = await authService.updateProfile(userId, { name, phone, avatar });

    return sendSuccess(res, 200, 'Profile updated', {
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/auth/change-password
 * Change password of authenticated user
 */
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user._id;
    const { oldPassword, newPassword } = req.body;
    await authService.changePassword(userId, { oldPassword, newPassword });

    return sendSuccess(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh-token
 * Refresh access token using refresh token cookie or body
 */
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await authService.refreshToken(token);

    return sendSuccess(res, 200, 'Token refreshed', result);
  } catch (error) {
    next(error);
  }
};
