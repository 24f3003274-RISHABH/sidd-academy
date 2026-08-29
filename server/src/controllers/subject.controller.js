import { subjectService } from '../services/subject.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Subject Controller - Handles subject API endpoints
 */

/**
 * GET /api/v1/subjects or GET /api/v1/subjects/:courseId
 */
export const getSubjectsByCourse = async (req, res, next) => {
  try {
    const target = req.params.id || req.params.courseId || req.query.courseId || req.query.course;
    if (!target) {
      return sendSuccess(res, 200, 'Subjects fetched', { subjects: [] });
    }
    
    // Check if target is a subject ID or course ID
    try {
      const single = await subjectService.getSubjectById(target);
      if (single && single.courseId !== target) {
        // It's a single subject
        return sendSuccess(res, 200, 'Subject fetched successfully', { subject: single, subjects: [single] });
      }
    } catch {
      // Not a single subject, treat as courseId
    }

    const subjects = await subjectService.getSubjectsByCourse(target);
    return sendSuccess(res, 200, 'Subjects fetched successfully', { subjects });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/subjects/:id
 */
export const getSubjectById = async (req, res, next) => {
  try {
    const subject = await subjectService.getSubjectById(req.params.id);
    return sendSuccess(res, 200, 'Subject fetched successfully', { subject });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/subjects (Admin only)
 */
export const createSubject = async (req, res, next) => {
  try {
    const subject = await subjectService.createSubject(req.body);
    return sendSuccess(res, 201, 'Subject created successfully', { subject });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/subjects/:id (Admin only)
 */
export const updateSubject = async (req, res, next) => {
  try {
    const subject = await subjectService.updateSubject(req.params.id, req.body);
    return sendSuccess(res, 200, 'Subject updated successfully', { subject });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/subjects/reorder (Admin only)
 */
export const reorderSubjects = async (req, res, next) => {
  try {
    await subjectService.reorderSubjects(req.body.orders || req.body);
    return sendSuccess(res, 200, 'Subjects reordered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/subjects/:id (Admin only)
 */
export const deleteSubject = async (req, res, next) => {
  try {
    await subjectService.deleteSubject(req.params.id);
    return sendSuccess(res, 200, 'Subject deleted successfully');
  } catch (error) {
    next(error);
  }
};
