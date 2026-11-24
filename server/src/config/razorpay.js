import Razorpay from 'razorpay';
import ENV from './env.js';

let razorpayInstance = null;
let cachedKeyId = null;

export const getRazorpay = () => {
  const keyId = (process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || ENV.RAZORPAY_KEY_ID || '').trim().replace(/^['"]|['"]$/g, '');
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || ENV.RAZORPAY_KEY_SECRET || '').trim().replace(/^['"]|['"]$/g, '');

  if (!razorpayInstance || cachedKeyId !== keyId) {
    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured in environment variables.');
    }
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    cachedKeyId = keyId;
  }
  return razorpayInstance;
};

export default getRazorpay;
