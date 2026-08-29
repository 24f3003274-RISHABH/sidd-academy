import { courseService } from '../services/course.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/v1/courses
 * List all published courses (or all courses for admin) with pagination, search, filters
 */
export const getAllCourses = async (req, res, next) => {
  try {
    const result = await courseService.getAllCourses(req.query, req.user);
    return sendSuccess(res, 200, 'Courses fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/courses/:id
 * Get single course with full hierarchy (Subjects -> Chapters -> Lessons)
 */
export const getCourseById = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(req.params.id, true);
    return sendSuccess(res, 200, 'Course fetched successfully', { course });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/courses/:id/content
 * Get full course syllabus hierarchy
 */
export const getCourseContent = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(req.params.id, true);
    return sendSuccess(res, 200, 'Course content fetched successfully', {
      courseId: course.id,
      title: course.title,
      subjects: course.subjects || [],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/courses (Admin only)
 * Create a new course
 */
export const createCourse = async (req, res, next) => {
  try {
    const course = await courseService.createCourse(req.body);
    return sendSuccess(res, 201, 'Course created successfully', { course });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/courses/:id (Admin only)
 * Update an existing course
 */
export const updateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body);
    return sendSuccess(res, 200, 'Course updated successfully', { course });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/courses/:id (Admin only)
 * Delete a course
 */
export const deleteCourse = async (req, res, next) => {
  try {
    await courseService.deleteCourse(req.params.id);
    return sendSuccess(res, 200, 'Course deleted successfully');
  } catch (error) {
    next(error);
  }
};
