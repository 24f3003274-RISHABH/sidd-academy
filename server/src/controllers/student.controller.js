import { studentService } from '../services/student.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Student Controller
 * Handles student dashboard data retrieval, course listing, notes, and lesson progress
 */
export class StudentController {
  /**
   * GET /api/v1/student/dashboard
   * Aggregate dashboard overview with courses, notes, classes, stats, and activities
   */
  getDashboard = async (req, res, next) => {
    try {
      const userId = req.user.id || req.user._id;
      const dashboardData = await studentService.getDashboardOverview(userId);
      return sendSuccess(res, 200, 'Student dashboard fetched successfully', dashboardData);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/student/courses
   * Get all enrolled courses with progress metrics
   */
  getEnrolledCourses = async (req, res, next) => {
    try {
      const userId = req.user.id || req.user._id;
      const courses = await studentService.getEnrolledCourses(userId);
      return sendSuccess(res, 200, 'Enrolled courses retrieved', { courses });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/student/notes
   * Get all purchased digital notes with download/view access
   */
  getPurchasedNotes = async (req, res, next) => {
    try {
      const userId = req.user.id || req.user._id;
      const notes = await studentService.getPurchasedNotes(userId);
      return sendSuccess(res, 200, 'Purchased notes retrieved', { notes });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/student/progress/:courseId
   * Get lesson progress status for a course
   */
  getCourseProgress = async (req, res, next) => {
    try {
      const userId = req.user.id || req.user._id;
      const { courseId } = req.params;
      const progress = await studentService.getCourseProgress(userId, courseId);
      return sendSuccess(res, 200, 'Course progress retrieved', progress);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/student/progress
   * Update lesson completion
   */
  updateLessonProgress = async (req, res, next) => {
    try {
      const userId = req.user.id || req.user._id;
      const { courseId, lessonId, isCompleted } = req.body;
      const result = await studentService.updateLessonProgress(userId, { courseId, lessonId, isCompleted });
      return sendSuccess(res, 200, 'Lesson progress updated', result);
    } catch (error) {
      next(error);
    }
  };
}

export const studentController = new StudentController();
export default studentController;
