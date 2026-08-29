import axiosInstance from './axiosInstance';

export const getAllVideos = (params) => axiosInstance.get('/videos', { params });
export const getVideoById = (id) => axiosInstance.get(`/videos/${id}`);
export const getVideosByLesson = (lessonId) => axiosInstance.get(`/videos/lesson/${lessonId}`);
export const createVideo = (data) => axiosInstance.post('/videos', data);
export const updateVideo = (id, data) => axiosInstance.put(`/videos/${id}`, data);
export const deleteVideo = (id) => axiosInstance.delete(`/videos/${id}`);
