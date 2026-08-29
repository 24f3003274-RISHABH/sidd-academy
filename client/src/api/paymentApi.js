import axiosInstance from './axiosInstance';

export const getRazorpayKey = () => axiosInstance.get('/payments/key');
export const createOrder = (items) => axiosInstance.post('/orders', Array.isArray(items) ? { items } : items);
export const verifyPayment = (data) => axiosInstance.post('/orders/verify', data);
export const getMyOrders = (params) => axiosInstance.get('/orders', { params });
export const getOrderById = (id) => axiosInstance.get(`/orders/${id}`);

export default {
  getRazorpayKey,
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
};
