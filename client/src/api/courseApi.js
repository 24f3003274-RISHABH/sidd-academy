import axiosInstance from './axiosInstance';

export const getAllCourses = (params) => axiosInstance.get('/courses', { params });
export const getCourseById = (id) => axiosInstance.get(`/courses/${id}`);
export const getCourseContent = (id) => axiosInstance.get(`/courses/${id}/content`);
export const createCourse = (data) => axiosInstance.post('/courses', data);
export const updateCourse = (id, data) => axiosInstance.put(`/courses/${id}`, data);
export const deleteCourse = (id) => axiosInstance.delete(`/courses/${id}`);
export const uploadThumbnail = (id, formData) => axiosInstance.post(`/courses/${id}/thumbnail`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
