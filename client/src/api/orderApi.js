import axiosInstance from './axiosInstance';

export const getPaymentKey = () => axiosInstance.get('/orders/key');
export const createOrder = (payload) => axiosInstance.post('/orders', payload);
export const verifyPayment = (payload) => axiosInstance.post('/orders/verify', payload);
export const getMyOrders = (params) => axiosInstance.get('/orders', { params });
export const getOrderById = (id) => axiosInstance.get(`/orders/${id}`);
export const cancelOrder = (id) => axiosInstance.patch(`/orders/${id}/cancel`);

export default {
  getPaymentKey,
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  cancelOrder,
};
