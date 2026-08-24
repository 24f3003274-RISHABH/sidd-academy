import express from 'express';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import * as adminController from '../controllers/admin.controller.js';

const router = express.Router();

router.use(protect, adminOnly); // Apply to all admin routes

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/role', adminController.updateUserRole);
router.put('/users/:id/status', adminController.toggleUserStatus);
router.get('/orders', adminController.getAllOrders);

export default router;
