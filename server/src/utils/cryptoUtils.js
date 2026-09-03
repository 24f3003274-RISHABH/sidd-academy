import crypto from 'crypto';
import ENV from '../config/env.js';

/**
 * Generates a cryptographically secure numeric OTP of the specified length.
 * Default: 6 digits (100000 - 999999).
 * @param {number} length
 * @returns {string}
 */
export const generateSecureOTP = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length);
  const code = crypto.randomInt(min, max);
  return code.toString();
};

/**
 * Hashes an OTP with HMAC-SHA256 using a server-side secret/pepper.
 * Prevents rainbow table and plain text storage in database.
 * @param {string} otp
 * @param {string} [secret]
 * @returns {string}
 */
export const hashOTP = (otp, secret = ENV.JWT_SECRET) => {
  const hmac = crypto.createHmac('sha256', secret || 'sidd_academy_secure_otp_pepper_2026');
  hmac.update(String(otp).trim());
  return hmac.digest('hex');
};

/**
 * Constant-time comparison between input OTP and stored OTP hash.
 * Protects against side-channel timing attacks.
 * @param {string} otp
 * @param {string} storedHash
 * @param {string} [secret]
 * @returns {boolean}
 */
export const verifyOTPHash = (otp, storedHash, secret = ENV.JWT_SECRET) => {
  if (!otp || !storedHash) return false;
  try {
    const computedHash = hashOTP(otp, secret);
    const bufferA = Buffer.from(computedHash, 'hex');
    const bufferB = Buffer.from(storedHash, 'hex');
    if (bufferA.length !== bufferB.length) return false;
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch (err) {
    return false;
  }
};
