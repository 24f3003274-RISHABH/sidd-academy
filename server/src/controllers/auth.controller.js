import { authService } from '../services/auth.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { setRefreshTokenCookie } from '../utils/generateToken.js';
import { sendWelcomeEmail } from '../utils/sendEmail.js';

/**
 * Controller for Authentication & Identity endpoints
 */

/**
 * POST /api/v1/auth/register
 * Register a new student account
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const result = await authService.register({ name, email, password, phone });

    // Set HTTP-only secure cookie for refresh token
    if (result.refreshToken) {
      setRefreshTokenCookie(res, result.refreshToken);
    }

    // Optional welcome email trigger
    sendWelcomeEmail(result.user.email, result.user.name).catch(() => {});

    return sendSuccess(res, 201, 'Registration successful', {
      user: result.user,
      token: result.token,
    });
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
