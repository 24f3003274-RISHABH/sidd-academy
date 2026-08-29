import { orderService } from '../services/order.service.js';
import { paymentGatewayService } from '../services/paymentGateway.service.js';
import { sendSuccess, AppError } from '../utils/apiResponse.js';

/**
 * Order Controller
 * Handles order creation, payment initiation, verification, and order retrieval
 */
export class OrderController {
  /**
   * Get public Razorpay Key ID
   * GET /api/v1/orders/key OR GET /api/v1/payments/key
   */
  getPaymentKey = (req, res) => {
    const key = paymentGatewayService.getPublicKey();
    const isMock = !paymentGatewayService.isConfigured();
    sendSuccess(res, 200, 'Payment gateway configuration retrieved', { key, isMock });
  };

  /**
   * Create an Order
   * POST /api/v1/orders
   * Body: { items: [{ itemId: string, itemType: 'course' | 'note' }], notes?: string }
   */
  createOrder = async (req, res, next) => {
    try {
      const userId = req.user.id || req.user._id;
      const { items, notes } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new AppError('Order items must be a non-empty array', 400);
      }

      const result = await orderService.createOrder(userId, { items, notes });
      return sendSuccess(res, 201, result.message || 'Order created successfully', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Server-Side Payment Verification & Access Granting
   * POST /api/v1/orders/verify OR POST /api/v1/payments/verify
   * Body: { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
   */
  verifyPayment = async (req, res, next) => {
    try {
      const userId = req.user.id || req.user._id;
      const {
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      } = req.body;

      const result = await orderService.verifyPayment(userId, {
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      return sendSuccess(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Current Student's Orders
   * GET /api/v1/orders OR GET /api/v1/payments/my-orders
   */
  getMyOrders = async (req, res, next) => {
    try {
      const userId = req.user.id || req.user._id;
      const { page = 1, limit = 20 } = req.query;

      const result = await orderService.getUserOrders(userId, { page, limit });
      return sendSuccess(res, 200, 'Orders retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get Single Order by ID
   * GET /api/v1/orders/:id
   */
  getOrderById = async (req, res, next) => {
    try {
      const userId = req.user.id || req.user._id;
      const isAdmin = req.user.role === 'admin';
      const orderId = req.params.id;

      const order = await orderService.getOrderById(orderId, userId, isAdmin);
      return sendSuccess(res, 200, 'Order retrieved successfully', { order });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel an Order
   * PATCH /api/v1/orders/:id/cancel
   */
  cancelOrder = async (req, res, next) => {
    try {
      const userId = req.user.id || req.user._id;
      const isAdmin = req.user.role === 'admin';
      const orderId = req.params.id;

      const cancelled = await orderService.cancelOrder(orderId, userId, isAdmin);
      return sendSuccess(res, 200, 'Order cancelled successfully', { order: cancelled });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Admin: Get all system orders
   * GET /api/v1/admin/orders
   */
  getAllOrdersAdmin = async (req, res, next) => {
    try {
      const { page = 1, limit = 50, status, search } = req.query;
      const result = await orderService.getAllOrders({ page, limit, status, search });
      return sendSuccess(res, 200, 'All system orders retrieved', result);
    } catch (error) {
      next(error);
    }
  };
}

export const orderController = new OrderController();
export default orderController;
