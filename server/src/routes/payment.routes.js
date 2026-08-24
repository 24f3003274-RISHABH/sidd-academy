import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = express.Router();

router.get('/key', paymentController.getRazorpayKey);
router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify', protect, paymentController.verifyPayment);
router.get('/my-orders', protect, paymentController.getMyOrders);

export default router;
