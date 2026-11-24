import axiosInstance from './axiosInstance';

export const getAllNotes = (params) => axiosInstance.get('/notes', { params, cache: false });
export const getNoteById = (id) => axiosInstance.get(`/notes/${id}`, { cache: false });
export const getSecureAccess = (id) => axiosInstance.get(`/notes/${id}/access`, { cache: false });
export const downloadNote = (id) => axiosInstance.get(`/notes/${id}/download`, { cache: false });

/**
 * Fetch an authenticated PDF stream as a Blob (never renders raw JSON in an iframe).
 */
export const fetchNotePdfBlob = (id) =>
  axiosInstance.get(`/notes/${id}/stream`, {
    responseType: 'blob',
    cache: false,
    timeout: 60000,
  });

/**
 * Download an authenticated PDF file directly to the user's device.
 */
export const downloadNotePdfBlob = (id) =>
  axiosInstance.get(`/notes/${id}/download`, {
    params: { direct: 'true' },
    responseType: 'blob',
    cache: false,
    timeout: 60000,
  });

export const createNote = (formData) =>
  axiosInstance.post('/notes', formData, { timeout: 90000 });

export const updateNote = (id, data) =>
  axiosInstance.put(`/notes/${id}`, data, { timeout: 90000 });

export const deleteNote = (id) => axiosInstance.delete(`/notes/${id}`);
