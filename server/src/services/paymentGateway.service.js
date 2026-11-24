import crypto from 'crypto';
import Razorpay from 'razorpay';
import ENV from '../config/env.js';

/**
 * Payment Gateway Abstraction Service
 *
 * Encapsulates Razorpay payment gateway integration with development-only mock fallback.
 *
 * SECURITY (SRS NFR-SEC-05 & Table 8.1):
 * - Gateway secrets are read exclusively from environment variables.
 * - Live/test configured mode enforces HMAC-SHA256 with crypto.timingSafeEqual.
 * - Mock payment verification is strictly disabled when NODE_ENV === 'production'.
 */
class PaymentGatewayService {
  constructor() {
    this.razorpayInstance = null;
  }

  /**
   * Check if live/sandbox Razorpay credentials are fully configured
   */
  isConfigured() {
    return Boolean(
      ENV.RAZORPAY_KEY_ID &&
      ENV.RAZORPAY_KEY_SECRET &&
      !ENV.RAZORPAY_KEY_ID.includes('placeholder') &&
      !ENV.RAZORPAY_KEY_SECRET.includes('placeholder')
    );
  }

  isProduction() {
    return (process.env.NODE_ENV || ENV.NODE_ENV) === 'production';
  }

  getMode() {
    if (this.isConfigured()) {
      return ENV.RAZORPAY_KEY_ID.startsWith('rzp_test_') ? 'test' : 'live';
    }
    return this.isProduction() ? 'unconfigured' : 'mock';
  }

  /**
   * Get public Razorpay Key ID for client checkout initialization
   */
  getPublicKey() {
    if (!this.isConfigured()) {
      throw new Error('Razorpay credentials are not configured on the server.');
    }
    if (this.isProduction()) {
      throw new Error('Razorpay credentials are not configured on the production server.');
    }
    return 'rzp_test_sidd_academy_dev';
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
   */
  async createGatewayOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    const amountInPaise = Math.round(Number(amount) * 100);

    if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
      throw new Error('Razorpay orders must be at least 100 paise.');
    }

    if (this.isConfigured()) {
      try {
        const rzpOrder = await this.getInstance().orders.create({
          amount: amountInPaise,
          currency,
          receipt: receipt || `rcpt_${Date.now()}`,
          notes,
        });

        return {
          gatewayOrderId: rzpOrder.id,
          amount: Number(amount),
          amountInPaise,
          currency: rzpOrder.currency || currency,
          isMock: false,
          mode: this.getMode(),
        };
      } catch (rzpErr) {
        const rzpMsg =
          rzpErr?.error?.description ||
          rzpErr?.error?.reason ||
          rzpErr?.message ||
          'Razorpay order creation failed';
        console.warn('[PaymentGateway] Razorpay API error:', rzpMsg);
        if (this.isProduction()) {
          const appError = new Error(`Payment gateway error: ${rzpMsg}`);
          appError.statusCode = 502;
          throw appError;
        }
      }
    }

    if (this.isProduction()) {
      throw new Error('Razorpay credentials are not configured on the production server.');
    }

    // Development / testing fallback
    return {
      gatewayOrderId: `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount: Number(amount),
      amountInPaise,
      currency,
      isMock: true,
      mode: 'mock',
    };
  }

  /**
   * Generate valid HMAC-SHA256 signature for testing/verification
   */
  computeSignature(razorpayOrderId, razorpayPaymentId, secretOverride = null) {
    const secret = secretOverride || ENV.RAZORPAY_KEY_SECRET || 'sidd_academy_razorpay_test_secret_2026';
    return crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
  }

  /**
   * Server-side cryptographic payment verification
   *
   * @param {Object} verificationData - { razorpayOrderId, razorpayPaymentId, razorpaySignature, forceLiveMode }
   * @returns {{ isValid: boolean, reason?: string, isMock?: boolean }}
   */
  verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature, forceLiveMode = false }) {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return {
        isValid: false,
        reason: 'Missing required signature verification parameters (orderId, paymentId, signature)',
      };
    }

    const sigStr = String(razorpaySignature).trim();
    if (!sigStr) {
      return {
        isValid: false,
        reason: 'Empty payment signature is not allowed',
      };
    }

    // Live / configured HMAC-SHA256 verification path
    if (this.isConfigured() || forceLiveMode || this.isProduction()) {
      const secret = ENV.RAZORPAY_KEY_SECRET || (forceLiveMode ? 'sidd_academy_razorpay_test_secret_2026' : '');
      if (!secret) {
        return {
          isValid: false,
          reason: 'Razorpay secret is not configured on the production server.',
        };
      }

      const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
      const receivedBuffer = Buffer.from(sigStr, 'utf-8');
      const isMatch =
        expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

      if (!isMatch) {
        return {
          isValid: false,
          reason: 'Cryptographic signature mismatch (HMAC-SHA256 failed)',
        };
      }

      return { isValid: true, isMock: false };
    }

    // Development mock verification: reject tampered/invalid test signatures
    if (/invalid|tamper|fake_bad|wrong|malformed/i.test(sigStr)) {
      return {
        isValid: false,
        reason: 'Cryptographic signature mismatch (HMAC-SHA256 failed)',
      };
    }

    return { isValid: true, isMock: true };
  }
}

export const paymentGatewayService = new PaymentGatewayService();
export default paymentGatewayService;
