import { chapterService } from '../services/chapter.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Chapter Controller - Handles chapter API endpoints
 */

/**
 * GET /api/v1/chapters or GET /api/v1/chapters/:subjectId
 */
export const getChaptersBySubject = async (req, res, next) => {
  try {
    const target = req.params.id || req.params.subjectId || req.query.subjectId || req.query.subject;
    if (!target) {
      return sendSuccess(res, 200, 'Chapters fetched', { chapters: [] });
    }

    try {
      const single = await chapterService.getChapterById(target);
      if (single && single.subjectId !== target) {
        return sendSuccess(res, 200, 'Chapter fetched successfully', { chapter: single, chapters: [single] });
      }
    } catch {
      // Treat as subjectId
    }

    const chapters = await chapterService.getChaptersBySubject(target);
    return sendSuccess(res, 200, 'Chapters fetched successfully', { chapters });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/chapters/:id
 */
export const getChapterById = async (req, res, next) => {
  try {
    const chapter = await chapterService.getChapterById(req.params.id);
    return sendSuccess(res, 200, 'Chapter fetched successfully', { chapter });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/chapters (Admin only)
 */
export const createChapter = async (req, res, next) => {
  try {
    const chapter = await chapterService.createChapter(req.body);
    return sendSuccess(res, 201, 'Chapter created successfully', { chapter });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/chapters/:id (Admin only)
 */
export const updateChapter = async (req, res, next) => {
  try {
    const chapter = await chapterService.updateChapter(req.params.id, req.body);
    return sendSuccess(res, 200, 'Chapter updated successfully', { chapter });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/chapters/reorder (Admin only)
 */
export const reorderChapters = async (req, res, next) => {
  try {
    await chapterService.reorderChapters(req.body.orders || req.body);
    return sendSuccess(res, 200, 'Chapters reordered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/chapters/:id (Admin only)
 */
export const deleteChapter = async (req, res, next) => {
  try {
    await chapterService.deleteChapter(req.params.id);
    return sendSuccess(res, 200, 'Chapter deleted successfully');
  } catch (error) {
    next(error);
  }
};
