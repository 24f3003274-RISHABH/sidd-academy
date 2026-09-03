import axiosInstance from './axiosInstance';

export const register = (data) => axiosInstance.post('/auth/register', data);
export const login = (data) => axiosInstance.post('/auth/login', data);
export const logout = () => axiosInstance.post('/auth/logout');
export const getMe = () => axiosInstance.get('/auth/me');
export const updateProfile = (data) => axiosInstance.put('/auth/profile', data);
export const changePassword = (data) => axiosInstance.put('/auth/change-password', data);
export const refreshToken = () => axiosInstance.post('/auth/refresh-token');
