import { orderRepository } from '../repositories/order.repository.js';
import { courseRepository } from '../repositories/course.repository.js';
import { noteRepository } from '../repositories/note.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { paymentGatewayService } from './paymentGateway.service.js';
import { AppError } from '../utils/apiResponse.js';
import { ORDER_STATUS, PAYMENT_STATUS, ITEM_TYPES } from '../constants/index.js';
import { sendPurchaseConfirmation } from '../utils/sendEmail.js';

/**
 * Order Service - Core Business Logic Layer for Orders & Payments
 * 
 * SECURITY & INTEGRITY:
 * 1. NEVER trusts price values coming from the client/frontend payload.
 * 2. Fetches canonical resource prices strictly from PostgreSQL / Data Access Layer.
 * 3. Enforces server-side payment signature verification prior to granting course/note access.
 * 4. Prevents duplicate enrollments and duplicate note purchases.
 * 5. Uses transactional execution to guarantee consistency.
 */
export class OrderService {
  /**
   * Create an Order with Server-Side Price Calculation & Payment Gateway Checkout
   */
  async createOrder(userId, { items, notes = '' }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('Order items must be a non-empty array', 400);
    }

    let calculatedTotal = 0;
    const validatedItems = [];

    for (const rawItem of items) {
      const { itemId, itemType, type } = rawItem;
      const effectiveType = (itemType || type || '').toLowerCase();

      if (!itemId) {
        throw new AppError('Each order item must specify a valid itemId', 400);
      }

      if (![ITEM_TYPES.COURSE, ITEM_TYPES.NOTE].includes(effectiveType)) {
        throw new AppError(`Invalid itemType "${effectiveType}". Allowed types: course, note`, 400);
      }

      if (effectiveType === ITEM_TYPES.COURSE) {
        // 1. Fetch genuine course from PostgreSQL
        const course = await courseRepository.findById(itemId);
        if (!course) {
          throw new AppError(`Course with ID "${itemId}" not found`, 404);
        }

        // 2. Prevent duplicate enrollment
        const isAlreadyEnrolled = await orderRepository.checkUserEnrollment(userId, course.id || course._id);
        if (isAlreadyEnrolled) {
          throw new AppError(`You are already enrolled in "${course.title}". Duplicate enrollments are not permitted.`, 400);
        }

        // 3. Retrieve actual server price (never trust frontend)
        let genuinePrice = 0;
        if (course.discountPrice !== undefined && course.discountPrice !== null && Number(course.discountPrice) >= 0) {
          genuinePrice = Number(course.discountPrice);
        } else if (course.price !== undefined && course.price !== null) {
          genuinePrice = Number(course.price);
        }

        // Handle free courses
        if (course.isFree || genuinePrice < 0) {
          genuinePrice = 0;
        }

        calculatedTotal += genuinePrice;
        validatedItems.push({
          itemType: ITEM_TYPES.COURSE,
          itemId: course.id || course._id,
          title: course.title,
          price: genuinePrice,
        });

      } else if (effectiveType === ITEM_TYPES.NOTE) {
        // 1. Fetch genuine note from PostgreSQL
        const note = await noteRepository.findById(itemId);
        if (!note) {
          throw new AppError(`Digital note with ID "${itemId}" not found`, 404);
        }

        // 2. Prevent duplicate note purchase
        const alreadyPurchased = await orderRepository.checkUserNotePurchase(userId, note.id || note._id);
        if (alreadyPurchased) {
          throw new AppError(`You have already purchased the digital note "${note.title}".`, 400);
        }

        // 3. Check if user already has access via parent course enrollment
        if (note.courseId) {
          const hasCourseAccess = await orderRepository.checkUserEnrollment(userId, note.courseId);
          if (hasCourseAccess) {
            throw new AppError(`You already have full access to this note through your course enrollment.`, 400);
          }
        }

        // 4. Retrieve actual server price
        let genuinePrice = 0;
        if (note.isFree || Number(note.price) === 0) {
          genuinePrice = 0;
        } else {
          genuinePrice = Number(note.price || 0);
        }

        calculatedTotal += genuinePrice;
        validatedItems.push({
          itemType: ITEM_TYPES.NOTE,
          itemId: note.id || note._id,
          title: note.title,
          price: genuinePrice,
        });
      }
    }

    // Round total to 2 decimal places to prevent floating point inaccuracies
    calculatedTotal = Math.round(calculatedTotal * 100) / 100;

    // Case 1: 100% Free Order (0 INR)
    if (calculatedTotal === 0) {
      const freeOrder = await orderRepository.createOrder({
        userId,
        items: validatedItems,
        totalAmount: 0,
        currency: 'INR',
        razorpayOrderId: null,
        receipt: `free_rcpt_${Date.now()}`,
        notes: notes || 'Free resource enrollment',
      });

      return {
        order: freeOrder,
        orderId: freeOrder.id,
        isFree: true,
        amount: 0,
        currency: 'INR',
        status: ORDER_STATUS.PAID,
        message: 'Enrolled successfully for free!',
      };
    }

    // Case 2: Paid Order (> 0 INR) - Initialize Payment Gateway Order
    const gatewayOrder = await paymentGatewayService.createGatewayOrder({
      amount: calculatedTotal,
      currency: 'INR',
      receipt: `rcpt_${userId.substring(0, 6)}_${Date.now()}`,
      notes: { userId, notes },
    });

    const pendingOrder = await orderRepository.createOrder({
      userId,
      items: validatedItems,
      totalAmount: calculatedTotal,
      currency: 'INR',
      razorpayOrderId: gatewayOrder.gatewayOrderId,
      receipt: `rcpt_${userId.substring(0, 6)}_${Date.now()}`,
      notes,
    });

    return {
      order: pendingOrder,
      orderId: pendingOrder.id,
      razorpayOrderId: gatewayOrder.gatewayOrderId,
      amount: calculatedTotal,
      amountInPaise: gatewayOrder.amountInPaise,
      currency: 'INR',
      keyId: paymentGatewayService.getPublicKey(),
      status: ORDER_STATUS.PENDING,
      isMock: gatewayOrder.isMock,
      items: validatedItems,
    };
  }

  /**
   * Server-Side Payment Verification & Access Granting
   * 
   * CRITICAL SECURITY RULE:
   * Access is ONLY granted after rigorous cryptographic HMAC-SHA256 signature verification
   * executed on the server.
   */
  async verifyPayment(userId, { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const effectiveOrderId = orderId || razorpayOrderId || razorpay_order_id;
    const effectiveRzpOrderId = razorpayOrderId || razorpay_order_id;
    const effectiveRzpPaymentId = razorpayPaymentId || razorpay_payment_id;
    const effectiveRzpSignature = razorpaySignature || razorpay_signature;

    if (!effectiveOrderId && !effectiveRzpOrderId) {
      throw new AppError('Order ID or Razorpay Order ID is required for verification', 400);
    }

    // 1. Locate Order in database
    let order = null;
    if (effectiveOrderId) {
      order = await orderRepository.findById(effectiveOrderId);
    }
    if (!order && effectiveRzpOrderId) {
      order = await orderRepository.findByRazorpayOrderId(effectiveRzpOrderId);
    }

    if (!order) {
      throw new AppError('Order record not found', 404);
    }

    // Authorization check (student can only verify their own order, unless admin)
    if (order.userId !== userId && order.user?.id !== userId && order.user?._id !== userId) {
      throw new AppError('Unauthorized: You can only verify payments for your own orders', 403);
    }

    // 2. Idempotency Check: If already paid, return without re-processing
    if (order.status === ORDER_STATUS.PAID) {
      return {
        success: true,
        alreadyVerified: true,
        message: 'Payment has already been verified and access is active.',
        order,
      };
    }

    if (order.status === ORDER_STATUS.CANCELLED) {
      throw new AppError('Cannot verify payment for a cancelled order', 400);
    }

    // 3. Cryptographic Signature Verification
    const verificationResult = paymentGatewayService.verifyPaymentSignature({
      razorpayOrderId: order.razorpayOrderId || effectiveRzpOrderId,
      razorpayPaymentId: effectiveRzpPaymentId,
      razorpaySignature: effectiveRzpSignature,
    });

    if (!verificationResult.isValid) {
      console.error('❌ [Payment Verification Failed]:', verificationResult.reason);
      throw new AppError(`Payment verification failed: ${verificationResult.reason || 'Invalid cryptographic signature'}`, 400);
    }

    // 4. Atomic Database Transaction: Mark order PAID, payment SUCCESS, grant enrollments & note purchases
    const verifiedOrder = await orderRepository.executePaymentVerificationTransaction({
      orderId: order.id,
      userId,
      razorpayPaymentId: effectiveRzpPaymentId,
      razorpaySignature: effectiveRzpSignature,
      gatewayResponse: {
        verifiedAt: new Date().toISOString(),
        gateway: 'razorpay',
        isMock: verificationResult.isMock || false,
      },
    });

    // 5. Send purchase confirmation notification email (asynchronous, non-blocking)
    try {
      const user = await userRepository.findById(userId);
      if (user && user.email) {
        sendPurchaseConfirmation(user.email, user.name || 'Student', verifiedOrder.items, verifiedOrder.totalAmount)
          .catch(emailErr => console.warn('Purchase confirmation email notice:', emailErr.message));
      }
    } catch (err) {
      console.warn('Purchase confirmation email lookup error:', err.message);
    }

    return {
      success: true,
      message: 'Payment verified successfully. Full access granted.',
      order: verifiedOrder,
    };
  }

  /**
   * Get single order by ID
   */
  async getOrderById(orderId, userId, isAdmin = false) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!isAdmin && order.userId !== userId && order.user?.id !== userId && order.user?._id !== userId) {
      throw new AppError('Unauthorized: You do not have permission to view this order', 403);
    }

    return order;
  }

  /**
   * Get current student's orders
   */
  async getUserOrders(userId, { page = 1, limit = 20 } = {}) {
    return orderRepository.findByUserId(userId, { page, limit });
  }

  /**
   * Admin: List all orders with filters
   */
  async getAllOrders({ page = 1, limit = 50, status, search } = {}) {
    return orderRepository.findAll({ page, limit, status, search });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId, userId, isAdmin = false) {
    return orderRepository.cancelOrder(orderId, userId, isAdmin);
  }
}

export const orderService = new OrderService();
export default orderService;
