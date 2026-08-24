import axiosInstance from './axiosInstance';

export const getDashboardStats = () => axiosInstance.get('/admin/dashboard');
export const getAllUsers = (params) => axiosInstance.get('/admin/users', { params });
export const updateUserRole = (id, role) => axiosInstance.put(`/admin/users/${id}/role`, { role });
export const toggleUserStatus = (id) => axiosInstance.put(`/admin/users/${id}/status`);
export const getAllOrders = (params) => axiosInstance.get('/admin/orders', { params });

export const getAllBanners = () => axiosInstance.get('/banners');
export const getActiveBanners = () => axiosInstance.get('/banners/active');
export const createBanner = (data) => axiosInstance.post('/banners', data);
export const updateBanner = (id, data) => axiosInstance.put(`/banners/${id}`, data);
export const deleteBanner = (id) => axiosInstance.delete(`/banners/${id}`);

export const createSubject = (data) => axiosInstance.post('/subjects', data);
export const updateSubject = (id, data) => axiosInstance.put(`/subjects/${id}`, data);
export const deleteSubject = (id) => axiosInstance.delete(`/subjects/${id}`);
export const getSubjectsByCourse = (courseId) => axiosInstance.get(`/subjects/${courseId}`);

export const createChapter = (data) => axiosInstance.post('/chapters', data);
export const updateChapter = (id, data) => axiosInstance.put(`/chapters/${id}`, data);
export const deleteChapter = (id) => axiosInstance.delete(`/chapters/${id}`);
export const getChaptersBySubject = (subjectId) => axiosInstance.get(`/chapters/${subjectId}`);

export const createClass = (data) => axiosInstance.post('/classes', data);
export const updateClass = (id, data) => axiosInstance.put(`/classes/${id}`, data);
export const deleteClass = (id) => axiosInstance.delete(`/classes/${id}`);
