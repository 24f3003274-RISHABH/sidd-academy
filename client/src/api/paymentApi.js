import orderApi, {
  getPaymentKey,
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
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
  cancelOrder,
  failOrder,
};

export default {
  ...orderApi,
  getRazorpayKey,
};
