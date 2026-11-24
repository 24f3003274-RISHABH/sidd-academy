import orderApi, {
  getPaymentKey,
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  retryOrder,
  cancelOrder,
  failOrder,
} from './orderApi';

export const getRazorpayKey = getPaymentKey;
export {
  getPaymentKey,
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  retryOrder,
  cancelOrder,
  failOrder,
};

export default {
  ...orderApi,
  getRazorpayKey,
};
