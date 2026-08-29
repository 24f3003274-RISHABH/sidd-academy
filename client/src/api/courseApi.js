import axiosInstance from './axiosInstance';

// Courses
export const getAllCourses = (params) => axiosInstance.get('/courses', { params });
export const getCourseById = (id) => axiosInstance.get(`/courses/${id}`);
export const getCourseContent = (id) => axiosInstance.get(`/courses/${id}/content`);
export const createCourse = (data) => axiosInstance.post('/courses', data);
export const updateCourse = (id, data) => axiosInstance.put(`/courses/${id}`, data);
export const deleteCourse = (id) => axiosInstance.delete(`/courses/${id}`);

// Subjects
export const getSubjectsByCourse = (courseId) => axiosInstance.get('/subjects', { params: { courseId } });
export const getSubjectById = (id) => axiosInstance.get(`/subjects/${id}`);
export const createSubject = (data) => axiosInstance.post('/subjects', data);
export const updateSubject = (id, data) => axiosInstance.put(`/subjects/${id}`, data);
export const reorderSubjects = (orders) => axiosInstance.put('/subjects/reorder', { orders });
export const deleteSubject = (id) => axiosInstance.delete(`/subjects/${id}`);

// Chapters
export const getChaptersBySubject = (subjectId) => axiosInstance.get('/chapters', { params: { subjectId } });
export const getChapterById = (id) => axiosInstance.get(`/chapters/${id}`);
export const createChapter = (data) => axiosInstance.post('/chapters', data);
export const updateChapter = (id, data) => axiosInstance.put(`/chapters/${id}`, data);
export const reorderChapters = (orders) => axiosInstance.put('/chapters/reorder', { orders });
export const deleteChapter = (id) => axiosInstance.delete(`/chapters/${id}`);

// Lessons / Daily Classes
export const getLessonsByChapter = (chapterId) => axiosInstance.get('/lessons', { params: { chapterId } });
export const getLessonById = (id) => axiosInstance.get(`/lessons/${id}`);
export const createLesson = (data) => axiosInstance.post('/lessons', data);
export const updateLesson = (id, data) => axiosInstance.put(`/lessons/${id}`, data);
export const reorderLessons = (orders) => axiosInstance.put('/lessons/reorder', { orders });
export const deleteLesson = (id) => axiosInstance.delete(`/lessons/${id}`);

// Aliases
export const getClassesByChapter = getLessonsByChapter;
export const getClassById = getLessonById;
export const createClass = createLesson;
export const updateClass = updateLesson;
export const deleteClass = deleteLesson;
