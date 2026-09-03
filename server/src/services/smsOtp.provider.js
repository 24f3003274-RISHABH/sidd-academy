import ENV from '../config/env.js';
import { formatMSG91Mobile, maskPhone } from '../utils/phoneValidator.js';

/**
 * MSG91 SMS OTP Provider
 * Dispatches transactional SMS verification codes to Indian mobile numbers via MSG91 OTP API.
 * 
 * Complies with strict security standards:
 * - Formats numbers to DoT and gateway requirements (91XXXXXXXXXX)
 * - Never logs the plain OTP
 * - Uses modular environment variables
 */
export class SmsOtpProvider {
  /**
   * Dispatches the SMS OTP through MSG91 API.
   * @param {Object} params
   * @param {string} params.phone - Indian mobile number (e.g., "+91 9876543210" or "9876543210")
   * @param {string} params.otp - 6-digit OTP
   * @param {number} [params.expiryMinutes]
   * @returns {Promise<{ success: boolean, messageId?: string, simulated?: boolean, error?: string }>}
   */
  async sendOtp({ phone, otp, expiryMinutes = 5 }) {
    const formattedMobile = formatMSG91Mobile(phone);
    if (!formattedMobile) {
      return { success: false, error: 'Invalid Indian mobile number format' };
    }

    const authKey = ENV.MSG91_AUTH_KEY;
    const templateId = ENV.MSG91_TEMPLATE_ID;
    const senderId = ENV.MSG91_SENDER_ID || 'SIDDAC';
    const expiry = Number(ENV.MSG91_OTP_EXPIRY || expiryMinutes || 5);

    // In production, real credentials are strictly required; never simulate silently in production
    if (!authKey || !templateId) {
      if (ENV.NODE_ENV === 'production') {
        console.error('[MSG91 SMS Provider] MSG91_AUTH_KEY or MSG91_TEMPLATE_ID missing in production environment.');
        return {
          success: false,
          error: 'SMS service configuration is missing on the server. Please configure MSG91_AUTH_KEY and MSG91_TEMPLATE_ID in Render environment variables.',
        };
      }
      console.warn(`[MSG91 SMS Provider - Development Simulation] MSG91 credentials not set. Simulated SMS delivery to ${maskPhone(phone)}.`);
      return { success: true, simulated: true, messageId: `sim_sms_${Date.now()}` };
    }

    try {
      // MSG91 v5 OTP API Endpoint
      // Official API: https://control.msg91.com/api/v5/otp
      const url = new URL('https://control.msg91.com/api/v5/otp');
      url.searchParams.append('template_id', templateId);
      url.searchParams.append('mobile', formattedMobile);
      url.searchParams.append('authkey', authKey);
      url.searchParams.append('otp', otp);
      url.searchParams.append('otp_expiry', String(expiry));
      if (senderId) {
        url.searchParams.append('sender', senderId);
      }

      const bodyPayload = {
        template_id: templateId,
        mobile: formattedMobile,
        otp: String(otp),
        otp_expiry: expiry,
      };
      if (senderId) {
        bodyPayload.sender = senderId;
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': authKey,
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await response.json().catch(() => ({}));

      // MSG91 returns { type: 'success', message: '...' } on valid dispatch
      if (!response.ok || (data.type && data.type !== 'success')) {
        const errorMsg = data.message || `Failed to dispatch SMS via MSG91 API (HTTP ${response.status})`;
        console.error('[MSG91 Provider Error]', errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      return {
        success: true,
        messageId: data.request_id || `msg91_${Date.now()}`,
      };
    } catch (error) {
      console.error('[MSG91 Provider Network Failure]', error.message);
      return {
        success: false,
        error: error.message || 'MSG91 service connection failed',
      };
    }
  }
}

export const smsOtpProvider = new SmsOtpProvider();
export default smsOtpProvider;
