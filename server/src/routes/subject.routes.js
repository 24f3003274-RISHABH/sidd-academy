import express from 'express';
import * as subjectController from '../controllers/subject.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { createSubjectValidator, updateSubjectValidator } from '../validators/subject.validator.js';
import { validateRequest } from '../middleware/validate.middleware.js';

const router = express.Router();

/**
 * Public / Student Endpoints
 */
router.get('/', subjectController.getSubjectsByCourse);
router.get('/:id', subjectController.getSubjectById);

/**
 * Admin Only Management Endpoints
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  createSubjectValidator,
  validateRequest,
  subjectController.createSubject
);

router.put(
  '/reorder',
  authenticate,
  authorize('ADMIN'),
  subjectController.reorderSubjects
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  updateSubjectValidator,
  validateRequest,
  subjectController.updateSubject
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  subjectController.deleteSubject
);

export default router;
