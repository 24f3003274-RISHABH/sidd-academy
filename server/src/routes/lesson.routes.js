import express from 'express';
import * as lessonController from '../controllers/lesson.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { createLessonValidator, updateLessonValidator } from '../validators/lesson.validator.js';
import { validateRequest } from '../middleware/validate.middleware.js';

const router = express.Router();

/**
 * Public / Student Endpoints
 */
router.get('/', lessonController.getLessonsByChapter);
router.get('/:id', lessonController.getLessonById);

/**
 * Admin Only Management Endpoints
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  createLessonValidator,
  validateRequest,
  lessonController.createLesson
);

router.put(
  '/reorder',
  authenticate,
  authorize('ADMIN'),
  lessonController.reorderLessons
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  updateLessonValidator,
  validateRequest,
  lessonController.updateLesson
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  lessonController.deleteLesson
);

export default router;
