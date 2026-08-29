import { orderController } from './order.controller.js';

export const getRazorpayKey = orderController.getPaymentKey;
export const createOrder = orderController.createOrder;
export const verifyPayment = orderController.verifyPayment;
export const getMyOrders = orderController.getMyOrders;

export default {
  getRazorpayKey,
  createOrder,
  verifyPayment,
  getMyOrders,
};
