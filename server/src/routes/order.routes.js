import express from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware.js';
import { orderController } from '../controllers/order.controller.js';
import {
  validateCreateOrder,
  validateVerifyPayment,
  validateOrderIdParam,
  validateOrderQueryParams,
} from '../validators/order.validator.js';

const router = express.Router();

// Public / Authenticated key endpoint
router.get('/key', orderController.getPaymentKey);

// Student Protected Endpoints
router.use(protect);

router.post('/', validateCreateOrder, orderController.createOrder);
router.post('/verify', validateVerifyPayment, orderController.verifyPayment);
router.get('/', validateOrderQueryParams, orderController.getMyOrders);
router.get('/:id', validateOrderIdParam, orderController.getOrderById);
router.patch('/:id/cancel', validateOrderIdParam, orderController.cancelOrder);

export default router;
