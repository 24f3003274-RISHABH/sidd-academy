import axiosInstance from './axiosInstance';

export const getAllNotes = (params) => axiosInstance.get('/notes', { params });
export const getNoteById = (id) => axiosInstance.get(`/notes/${id}`);
export const downloadNote = (id) => axiosInstance.get(`/notes/${id}/download`, { responseType: 'blob' });
export const createNote = (formData) => axiosInstance.post('/notes', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateNote = (id, data) => axiosInstance.put(`/notes/${id}`, data);
export const deleteNote = (id) => axiosInstance.delete(`/notes/${id}`);
