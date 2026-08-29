import jwt from 'jsonwebtoken';
import { authRepository } from '../repositories/auth.repository.js';
import { AppError } from '../utils/apiResponse.js';
import ENV from '../config/env.js';

/**
 * SECURITY-SENSITIVE: JWT Authentication Middleware
 * 
 * Flow:
 * 1. Extracts Bearer token from 'Authorization' header or 'refreshToken' cookie.
 * 2. Cryptographically verifies JWT signature against server's JWT_ACCESS_SECRET.
 * 3. Checks token expiration and decoding payload.
 * 4. Resolves user from repository (PostgreSQL or fallback store).
 * 5. Verifies account active status (`is_active` / `isActive`).
 * 6. Attaches sanitized user record to `req.user`.
 * 
 * Rejects unauthenticated requests with HTTP 401 Unauthorized.
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Extract Bearer Token from HTTP Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1].trim();
    } else if (req.cookies && req.cookies.token) {
      // Fallback: check cookie if header not provided
      token = req.cookies.token;
    }

    if (!token || token === 'undefined' || token === 'null') {
      return next(new AppError('Not authenticated. Please log in to access this resource.', 401));
    }

    // 2. Verify JWT signature using access secret
    const secret = ENV.JWT_ACCESS_SECRET || ENV.JWT_SECRET;
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Session expired. Please log in again.', 401));
      }
      return next(new AppError('Invalid authentication token. Please log in again.', 401));
    }

    if (!decoded || !decoded.id) {
      return next(new AppError('Malformed token payload.', 401));
    }

    // 3. Retrieve user profile by id from repository
    const user = await authRepository.findById(decoded.id);
    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401));
    }

    // 4. Ensure user account is active
    const isActive = user.is_active !== undefined ? user.is_active : (user.isActive !== undefined ? user.isActive : true);
    if (!isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401));
    }

    // 5. Normalize user role to facilitate uniform RBAC evaluation
    const normalizedRole = (user.role || 'student').toLowerCase();
    const userPayload = {
      ...user,
      id: user.id || user._id,
      _id: user.id || user._id,
      role: normalizedRole === 'user' ? 'student' : normalizedRole,
      rawRole: user.role,
    };

    // Attach to request object for downstream controllers and authorize middleware
    req.user = userPayload;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Authentication Middleware
 * Populates req.user if a valid token is provided, but does not block requests if token is missing.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1].trim();
    }
    if (token && token !== 'undefined' && token !== 'null') {
      const secret = ENV.JWT_ACCESS_SECRET || ENV.JWT_SECRET;
      const decoded = jwt.verify(token, secret);
      if (decoded && decoded.id) {
        const user = await authRepository.findById(decoded.id);
        if (user && (user.is_active ?? user.isActive ?? true)) {
          const normalizedRole = (user.role || 'student').toLowerCase();
          req.user = {
            ...user,
            id: user.id || user._id,
            _id: user.id || user._id,
            role: normalizedRole === 'user' ? 'student' : normalizedRole,
          };
        }
      }
    }
    next();
  } catch (err) {
    // Silently proceed for optional auth
    next();
  }
};

// Aliases for compatibility
export const protect = authenticate;
export default authenticate;
