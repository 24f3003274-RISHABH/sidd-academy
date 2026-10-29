import crypto from 'crypto';
import Razorpay from 'razorpay';
import ENV from '../config/env.js';

/**
 * Payment Gateway Abstraction Service
 * 
 * Encapsulates Razorpay payment gateway integration.
 * 
 * SECURITY:
 * - Gateway secrets are read exclusively from environment variables.
 * - All payment verification happens strictly server-side using HMAC-SHA256.
 */
class PaymentGatewayService {
  constructor() {
    this.razorpayInstance = null;
  }

  /**
   * Check if live Razorpay credentials are fully configured
   */
  isConfigured() {
    return Boolean(
      ENV.RAZORPAY_KEY_ID && 
      ENV.RAZORPAY_KEY_SECRET && 
      !ENV.RAZORPAY_KEY_ID.includes('placeholder') &&
      !ENV.RAZORPAY_KEY_SECRET.includes('placeholder')
    );
  }

  getMode() {
    if (!this.isConfigured()) return 'unconfigured';
    return ENV.RAZORPAY_KEY_ID.startsWith('rzp_test_') ? 'test' : 'live';
  }

  /**
   * Get public Razorpay Key ID for client checkout initialization
   */
  getPublicKey() {
    if (!this.isConfigured()) {
      throw new Error('Razorpay credentials are not configured on the server.');
    }
    return ENV.RAZORPAY_KEY_ID;
  }

  /**
   * Lazy load Razorpay SDK instance
   */
  getInstance() {
    if (!this.razorpayInstance && this.isConfigured()) {
      this.razorpayInstance = new Razorpay({
        key_id: ENV.RAZORPAY_KEY_ID,
        key_secret: ENV.RAZORPAY_KEY_SECRET,
      });
    }
    return this.razorpayInstance;
  }

  /**
   * Create an order on the payment gateway
   * @param {Object} params - { amount (in INR), currency, receipt, notes }
   * @returns {Promise<{ gatewayOrderId: string, amount: number, currency: string, isMock: boolean }>}
   */
  async createGatewayOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    const amountInPaise = Math.round(Number(amount) * 100);

    if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
      throw new Error('Razorpay orders must be at least 100 paise.');
    }

    if (!this.isConfigured()) {
      throw new Error('Razorpay credentials are not configured on the server.');
    }

    let rzpOrder;
    try {
      rzpOrder = await this.getInstance().orders.create({
        amount: amountInPaise,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes,
      });
    } catch (rzpErr) {
      // Razorpay SDK errors are plain objects with statusCode/error fields – NOT Error instances.
      // We must never let a Razorpay 401 (bad credentials) reach the client as our own 401.
      const rzpMsg =
        rzpErr?.error?.description ||
        rzpErr?.error?.reason ||
        rzpErr?.message ||
        'Razorpay order creation failed';
      const rzpStatus = rzpErr?.statusCode || rzpErr?.status;
      console.error('[PaymentGateway] Razorpay order creation error:', rzpStatus, rzpMsg);

      // Map upstream Razorpay errors to application-level 502 Bad Gateway
      const appError = new Error(`Payment gateway error: ${rzpMsg}`);
      appError.statusCode = 502;
      throw appError;
    }

    return {
      gatewayOrderId: rzpOrder.id,
      amount: Number(amount),
      amountInPaise,
      currency: rzpOrder.currency || currency,
      isMock: false,
      mode: this.getMode(),
    };
  }

  /**
   * Server-side cryptographic payment verification
   * 
   * @param {Object} verificationData - { razorpayOrderId, razorpayPaymentId, razorpaySignature }
   * @returns {{ isValid: boolean, reason?: string }}
   */
  verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return {
        isValid: false,
        reason: 'Missing required signature verification parameters (orderId, paymentId, signature)',
      };
    }

    if (this.isConfigured()) {
      const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
        .update(payload)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
      const receivedBuffer = Buffer.from(razorpaySignature, 'utf-8');
      const isMatch = expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

      if (!isMatch) {
        return {
          isValid: false,
          reason: 'Cryptographic signature mismatch (HMAC-SHA256 failed)',
        };
      }

      return { isValid: true };
    }

    return {
      isValid: false,
      reason: 'Razorpay credentials are not configured on the server.',
    };
  }
}

export const paymentGatewayService = new PaymentGatewayService();
export default paymentGatewayService;
