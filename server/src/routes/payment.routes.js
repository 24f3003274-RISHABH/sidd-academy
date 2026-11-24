import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import * as paymentController from '../controllers/payment.controller.js';

const router = express.Router();

router.get('/key', paymentController.getRazorpayKey);
router.post('/webhook', paymentController.handleWebhook);
router.post('/create-order', protect, paymentController.createOrder);
router.post('/verify', protect, paymentController.verifyPayment);
router.post('/verify-payment', protect, paymentController.verifyPayment);
router.get('/my-orders', protect, paymentController.getMyOrders);
router.post('/:id/retry', protect, paymentController.retryOrder);

export default router;
