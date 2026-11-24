import { verifyPayment, cancelOrder, failOrder, getPaymentKey } from '../api/orderApi';
import { clearGetCache } from '../api/axiosInstance';

/**
 * Dynamically load Razorpay Standard Checkout JS once and cache it on window.Razorpay.
 */
export const loadRazorpayScript = () => {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true);
  }

  const existingScript = document.querySelector('script[data-razorpay-checkout]');
  if (existingScript) {
    if (existingScript.dataset.loaded === 'true' && window.Razorpay) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      existingScript.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.dataset.razorpayCheckout = 'true';
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve(Boolean(window.Razorpay));
    };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Format a clear, student-friendly explanation from Razorpay's payment.failed payload.
 */
const formatRazorpayFailure = (resp) => {
  const err = resp?.error || {};
  const code = err.code || '';
  const reason = err.reason || '';
  const step = err.step || '';
  const description = (err.description || '').trim();
  const paymentId = err.metadata?.payment_id || '';

  let userMessage = description;
  if (!userMessage) {
    if (reason === 'payment_cancelled') {
      userMessage = 'The payment was cancelled at your bank or UPI app.';
    } else if (reason === 'payment_timed_out') {
      userMessage = 'The payment timed out before confirmation. No money was charged.';
    } else if (reason === 'insufficient_funds') {
      userMessage = 'Payment declined due to insufficient funds. Please try another payment method.';
    } else {
      userMessage = 'Your payment was declined by the bank or payment provider. Please try again.';
    }
  }

  return {
    code,
    reason,
    step,
    description: userMessage,
    paymentId,
  };
};

/**
 * Open Razorpay Standard Checkout with rock-solid lifecycle handling for:
 *  - Success & signature verification (with 1 automatic retry for Render cold-start/network blips)
 *  - Payment failure (`payment.failed` event -> calls failOrder + updates UI immediately)
 *  - Checkout dismissal/cancellation (`options.modal.ondismiss` -> calls cancelOrder + updates UI immediately)
 *
 * NOTE: In Razorpay checkout.js, `ondismiss` MUST be provided inside `options.modal` (NOT via `.on('modal.ondismiss')`).
 */
export const launchRazorpayCheckout = async ({
  orderData,
  fallbackOrderId = null,
  description = 'Sidd Academy Enrollment',
  user = null,
  refreshUser = null,
  onVerifying = null,
  onSuccess = null,
  onFailed = null,
  onCancelled = null,
  onVerificationError = null,
  onDone = null,
}) => {
  const orderId = orderData?.orderId || fallbackOrderId;
  const { razorpayOrderId, amount, currency, keyId, isMock, amountInPaise } = orderData || {};

  let resolvedKey = (keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim();
  if (!resolvedKey) {
    try {
      const keyRes = await getPaymentKey();
      resolvedKey = (keyRes.data?.data?.key || keyRes.data?.key || '').trim();
    } catch {
      resolvedKey = '';
    }
  }

  if (isMock || !razorpayOrderId || razorpayOrderId.startsWith('order_mock_') || !resolvedKey) {
    if (orderId) {
      cancelOrder(orderId).catch(() => {});
    }
    throw new Error(
      'Payment gateway is not configured on the server yet. Please contact the administrator.'
    );
  }

  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded || typeof window.Razorpay === 'undefined') {
    if (orderId) {
      cancelOrder(orderId).catch(() => {});
    }
    throw new Error(
      'Could not load Razorpay Checkout. Please check your internet connection or disable ad-blockers and try again.'
    );
  }

  // Track lifecycle outcome so modal close after failure or success never overwrites status
  let outcome = null; // null | 'verifying' | 'paid' | 'failed' | 'cancelled'
  let lastFailure = null;
  let paymentObject = null;

  const finishLoading = () => {
    if (onDone) onDone();
  };

  const verifyWithRetry = async (payload) => {
    try {
      return await verifyPayment(payload);
    } catch (firstErr) {
      const status = firstErr.response?.status;
      // Retry once on network drop / Render 502-504 cold-start hiccup because payment already succeeded
      if (!status || status >= 500) {
        await new Promise((r) => setTimeout(r, 1500));
        return await verifyPayment(payload);
      }
      throw firstErr;
    }
  };

  const options = {
    key: resolvedKey,
    amount: amountInPaise ? String(amountInPaise) : Math.round(Number(amount) * 100).toString(),
    currency: currency || 'INR',
    name: 'Sidd Academy',
    description,
    order_id: razorpayOrderId,
    prefill: {
      name: user?.name || '',
      email: user?.email || '',
      contact: user?.phone || '',
    },
    theme: {
      color: '#2563eb',
    },
    modal: {
      escape: true,
      backdropclose: false,
      confirm_close: true,
      ondismiss: async () => {
        finishLoading();

        // Payment succeeded or is currently being verified — never mark cancelled
        if (outcome === 'paid' || outcome === 'verifying') {
          return;
        }

        // Payment already failed inside Razorpay — preserve FAILED status
        if (outcome === 'failed') {
          if (onFailed && lastFailure) {
            onFailed({ ...lastFailure, orderId, modalClosed: true });
          }
          return;
        }

        // User deliberately closed/cancelled checkout before completing payment
        outcome = 'cancelled';
        try {
          if (orderId) {
            await cancelOrder(orderId);
          }
        } catch {
          // Even if backend cancel call fails, still notify UI cleanly
        }
        clearGetCache();
        if (onCancelled) {
          onCancelled({
            orderId,
            message: 'Checkout was cancelled before payment. No amount was deducted.',
          });
        }
      },
    },
    handler: async (response) => {
      outcome = 'verifying';
      if (onVerifying) {
        onVerifying({
          orderId,
          razorpayPaymentId: response.razorpay_payment_id,
        });
      }

      try {
        const verifyRes = await verifyWithRetry({
          orderId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        outcome = 'paid';
        clearGetCache();
        if (refreshUser) {
          await refreshUser();
        }
        finishLoading();
        if (onSuccess) {
          onSuccess({
            orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            data: verifyRes.data?.data || verifyRes.data,
          });
        }
      } catch (err) {
        outcome = 'failed';
        finishLoading();
        const serverMsg =
          err.response?.data?.message ||
          'We received a payment response, but server verification failed. Please check Purchase History or contact support with your Payment ID.';
        if (onVerificationError) {
          onVerificationError({
            orderId,
            razorpayPaymentId: response.razorpay_payment_id,
            message: serverMsg,
          });
        }
      }
    },
  };

  paymentObject = new window.Razorpay(options);

  paymentObject.on('payment.failed', (resp) => {
    const failure = formatRazorpayFailure(resp);
    outcome = 'failed';
    lastFailure = failure;
    finishLoading();

    if (orderId) {
      failOrder(orderId, {
        code: failure.code,
        reason: failure.reason,
        description: failure.description,
        paymentId: failure.paymentId,
      }).catch(() => {});
    }
    clearGetCache();

    // Notify page immediately so the user sees the clear failure message even before closing the modal
    if (onFailed) {
      onFailed({
        ...failure,
        orderId,
        modalClosed: false,
      });
    }
  });

  paymentObject.open();
  return { orderId, paymentObject };
};

export default launchRazorpayCheckout;
