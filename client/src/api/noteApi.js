import axiosInstance from './axiosInstance';

export const getAllNotes = (params) => axiosInstance.get('/notes', { params, cache: false });
export const getNoteById = (id) => axiosInstance.get(`/notes/${id}`, { cache: false });
export const getSecureAccess = (id) => axiosInstance.get(`/notes/${id}/access`, { cache: false });
export const downloadNote = (id) => axiosInstance.get(`/notes/${id}/download`, { cache: false });
export const createNote = (formData) => axiosInstance.post('/notes', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const updateNote = (id, data) => {
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
  return axiosInstance.put(`/notes/${id}`, data, isFormData ? {
    headers: { 'Content-Type': 'multipart/form-data' },
  } : undefined);
};
export const deleteNote = (id) => axiosInstance.delete(`/notes/${id}`);
