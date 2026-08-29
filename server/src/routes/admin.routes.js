import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import * as adminController from '../controllers/admin.controller.js';

const router = express.Router();

// Enforce authentication AND admin role for all admin routes
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.get('/orders', adminController.getAllOrders);

export default router;
