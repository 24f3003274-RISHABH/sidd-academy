import ENV from '../config/env.js';

/**
 * Resend Email OTP Provider
 * Sends transactional OTP verification emails via the Resend REST API.
 * 
 * Complies with strict security standards:
 * - Never logs the OTP value
 * - Uses environment variables for authentication
 * - Includes security warning and validity period
 */
export class EmailOtpProvider {
  /**
   * Generates a styled responsive HTML email template for Sidd Academy OTP delivery.
   * @param {string} otp
   * @param {number} [expiryMinutes]
   * @returns {string}
   */
  generateEmailHtml(otp, expiryMinutes = 5) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sidd Academy Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); padding: 28px 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                SIDD ACADEMY
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #bfdbfe; font-weight: 500;">
                Academic Excellence for Classes 10th, 11th & 12th
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px;">
              <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0f172a;">
                Your Verification Code
              </h2>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
                Please enter the following one-time password (OTP) to securely complete your verification on Sidd Academy.
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #eff6ff; border: 1.5px dashed #3b82f6; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: monospace;">
                  ${otp}
                </div>
                <div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: #2563eb;">
                  Valid for ${expiryMinutes} minutes only
                </div>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; padding: 12px 16px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #991b1b; font-weight: 500;">
                  <strong>Security Warning:</strong> Do NOT share this code with anyone. Sidd Academy instructors and staff will never ask for your verification code or password.
                </p>
              </div>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                If you did not request this verification code, please disregard this email or contact support if you suspect unauthorized activity.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} Sidd Academy. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Dispatches the verification email through Resend API.
   * @param {Object} params
   * @param {string} params.email - Recipient email address
   * @param {string} params.otp - Plaintext OTP (used in payload, never logged)
   * @param {string} [params.subject]
   * @param {number} [params.expiryMinutes]
   * @returns {Promise<{ success: boolean, messageId?: string, simulated?: boolean, error?: string }>}
   */
  async sendOtp({ email, otp, subject = 'Sidd Academy - Your Verification Code', expiryMinutes = 5 }) {
    if (!email) {
      return { success: false, error: 'Recipient email is required' };
    }

    const apiKey = ENV.RESEND_API_KEY;

    // In development or when API key is missing, fail-safe with simulation
    if (!apiKey) {
      console.warn(`[Resend Email Provider] RESEND_API_KEY not configured. Simulated email delivery to ${email.slice(0, 3)}***@domain.`);
      return { success: true, simulated: true, messageId: `sim_${Date.now()}` };
    }

    try {
      const htmlContent = this.generateEmailHtml(otp, expiryMinutes);
      const fromSender = ENV.OTP_EMAIL_FROM || 'Sidd Academy <no-reply@siddacademy.com>';

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromSender,
          to: [email],
          subject: subject,
          html: htmlContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[Resend Provider Error]', data.message || data);
        return {
          success: false,
          error: data.message || 'Failed to dispatch email via Resend API',
        };
      }

      return {
        success: true,
        messageId: data.id,
      };
    } catch (error) {
      console.error('[Resend Provider Network Failure]', error.message);
      return {
        success: false,
        error: error.message || 'Resend service connection failed',
      };
    }
  }
}

export const emailOtpProvider = new EmailOtpProvider();
export default emailOtpProvider;
