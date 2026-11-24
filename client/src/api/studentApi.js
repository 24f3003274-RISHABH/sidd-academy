import axiosInstance from './axiosInstance';

export const getStudentDashboard = () => axiosInstance.get('/student/dashboard', { cache: false });
export const getStudentCourses = () => axiosInstance.get('/student/courses', { cache: false });
export const getStudentNotes = () => axiosInstance.get('/student/notes', { cache: false });
export const getCourseProgress = (courseId) => axiosInstance.get(`/student/progress/${courseId}`, { cache: false });
export const updateLessonProgress = (data) => axiosInstance.post('/student/progress', data);

export default {
  getStudentDashboard,
  getStudentCourses,
  getStudentNotes,
  getCourseProgress,
  updateLessonProgress,
};
