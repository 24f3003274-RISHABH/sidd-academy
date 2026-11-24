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
    const course = await courseService.getCourseById(req.params.id, true, req.user);
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
    const course = await courseService.getCourseById(req.params.id, true, req.user);
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
    const data = { ...req.body };
    if (req.file) data.thumbnail = `/uploads/images/${req.file.filename}`;
    const course = await courseService.createCourse(data);
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
    const data = { ...req.body };
    if (req.file) data.thumbnail = `/uploads/images/${req.file.filename}`;
    const course = await courseService.updateCourse(req.params.id, data);
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

/**
 * POST /api/v1/courses/playlist/preview (Admin only)
 * Fetch all videos and metadata from a YouTube playlist URL in exact order
 */
export const previewPlaylist = async (req, res, next) => {
  try {
    const input = req.body.playlistUrl || req.body.videoUrls || req.body.url;
    const result = await courseService.previewPlaylist(input);
    return sendSuccess(res, 200, 'YouTube playlist fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/courses/import-playlist (Admin only)
 * Import a YouTube playlist directly as a new Course or into an existing Course/Chapter
 */
export const importPlaylist = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (req.file) data.thumbnail = `/uploads/images/${req.file.filename}`;
    const result = await courseService.importPlaylistAsCourse(data);
    return sendSuccess(
      res,
      201,
      `Successfully imported ${result.importedCount} videos in playlist order`,
      result
    );
  } catch (error) {
    next(error);
  }
};
