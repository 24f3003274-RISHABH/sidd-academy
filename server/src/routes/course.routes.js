import express from 'express';
import * as courseController from '../controllers/course.controller.js';
import { authenticate, optionalAuth } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { createCourseValidator, updateCourseValidator, courseQueryValidator } from '../validators/course.validator.js';
import { validateRequest } from '../middleware/validate.middleware.js';

const router = express.Router();

/**
 * Public Course Endpoints (Optional Auth to customize user enrollments)
 */
router.get('/', optionalAuth, courseQueryValidator, validateRequest, courseController.getAllCourses);
router.get('/:id', optionalAuth, courseController.getCourseById);
router.get('/:id/content', optionalAuth, courseController.getCourseContent);

/**
 * Admin Course Management Endpoints
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  createCourseValidator,
  validateRequest,
  courseController.createCourse
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  updateCourseValidator,
  validateRequest,
  courseController.updateCourse
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  courseController.deleteCourse
);

export default router;
