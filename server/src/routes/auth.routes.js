import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';
import { validateRequest } from '../middleware/validate.middleware.js';

const router = express.Router();

/**
 * Public Authentication Endpoints
 */

// POST /api/v1/auth/register - Register a new student
router.post('/register', registerValidator, validateRequest, authController.register);

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

export default router;
