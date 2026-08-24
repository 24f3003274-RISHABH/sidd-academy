import axiosInstance from './axiosInstance';

export const getRazorpayKey = () => axiosInstance.get('/payments/key');
export const createOrder = (items) => axiosInstance.post('/payments/create-order', items);
export const verifyPayment = (data) => axiosInstance.post('/payments/verify', data);
export const getMyOrders = () => axiosInstance.get('/payments/my-orders');
