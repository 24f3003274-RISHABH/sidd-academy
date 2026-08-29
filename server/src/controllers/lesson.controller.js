import { lessonService } from '../services/lesson.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Lesson / Daily Class Controller - Handles lesson and class API endpoints
 */

/**
 * GET /api/v1/lessons or GET /api/v1/lessons/:chapterId
 */
export const getLessonsByChapter = async (req, res, next) => {
  try {
    const target = req.params.id || req.params.chapterId || req.query.chapterId || req.query.chapter;
    if (!target) {
      return sendSuccess(res, 200, 'Lessons fetched', { lessons: [], dailyClasses: [] });
    }

    try {
      const single = await lessonService.getLessonById(target);
      if (single && single.chapterId !== target) {
        return sendSuccess(res, 200, 'Lesson fetched successfully', {
          lesson: single,
          dailyClass: single,
          lessons: [single],
          dailyClasses: [single],
        });
      }
    } catch {
      // Treat as chapterId
    }

    const lessons = await lessonService.getLessonsByChapter(target);
    return sendSuccess(res, 200, 'Lessons fetched successfully', {
      lessons,
      dailyClasses: lessons,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/lessons/:id
 */
export const getLessonById = async (req, res, next) => {
  try {
    const lesson = await lessonService.getLessonById(req.params.id);
    return sendSuccess(res, 200, 'Lesson fetched successfully', {
      lesson,
      dailyClass: lesson,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/lessons (Admin only)
 */
export const createLesson = async (req, res, next) => {
  try {
    const lesson = await lessonService.createLesson(req.body);
    return sendSuccess(res, 201, 'Lesson created successfully', {
      lesson,
      dailyClass: lesson,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/lessons/:id (Admin only)
 */
export const updateLesson = async (req, res, next) => {
  try {
    const lesson = await lessonService.updateLesson(req.params.id, req.body);
    return sendSuccess(res, 200, 'Lesson updated successfully', {
      lesson,
      dailyClass: lesson,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/lessons/reorder (Admin only)
 */
export const reorderLessons = async (req, res, next) => {
  try {
    await lessonService.reorderLessons(req.body.orders || req.body);
    return sendSuccess(res, 200, 'Lessons reordered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/lessons/:id (Admin only)
 */
export const deleteLesson = async (req, res, next) => {
  try {
    await lessonService.deleteLesson(req.params.id);
    return sendSuccess(res, 200, 'Lesson deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Aliases for DailyClass compatibility
export const getClassesByChapter = getLessonsByChapter;
export const getClassById = getLessonById;
export const createClass = createLesson;
export const updateClass = updateLesson;
export const deleteClass = deleteLesson;
