import axiosInstance from './axiosInstance';

export const register = (data) => axiosInstance.post('/auth/register', data);
export const verifyRegistrationOtp = (data) => axiosInstance.post('/auth/verify-registration-otp', data);
export const forgotPassword = (data) => axiosInstance.post('/auth/forgot-password', data);
export const verifyResetOtp = (data) => axiosInstance.post('/auth/verify-reset-otp', data);
export const resetPassword = (data) => axiosInstance.post('/auth/reset-password', data);
export const resendOtp = (data) => axiosInstance.post('/auth/resend-otp', data);
export const sendMobileOtp = (data) => axiosInstance.post('/auth/send-mobile-otp', data);
export const verifyMobileOtp = (data) => axiosInstance.post('/auth/verify-mobile-otp', data);
export const login = (data) => axiosInstance.post('/auth/login', data);
export const logout = () => axiosInstance.post('/auth/logout');
export const getMe = () => axiosInstance.get('/auth/me');
export const updateProfile = (data) => axiosInstance.put('/auth/profile', data);
export const changePassword = (data) => axiosInstance.put('/auth/change-password', data);
export const refreshToken = () => axiosInstance.post('/auth/refresh-token');

