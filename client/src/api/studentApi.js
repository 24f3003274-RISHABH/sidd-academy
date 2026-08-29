import axiosInstance from './axiosInstance';

export const getStudentDashboard = () => axiosInstance.get('/student/dashboard');
export const getStudentCourses = () => axiosInstance.get('/student/courses');
export const getStudentNotes = () => axiosInstance.get('/student/notes');
export const getCourseProgress = (courseId) => axiosInstance.get(`/student/progress/${courseId}`);
export const updateLessonProgress = (data) => axiosInstance.post('/student/progress', data);

export default {
  getStudentDashboard,
  getStudentCourses,
  getStudentNotes,
  getCourseProgress,
  updateLessonProgress,
};
