import express from 'express';
import * as chapterController from '../controllers/chapter.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { createChapterValidator, updateChapterValidator } from '../validators/chapter.validator.js';
import { validateRequest } from '../middleware/validate.middleware.js';

const router = express.Router();

/**
 * Public / Student Endpoints
 */
router.get('/', chapterController.getChaptersBySubject);
router.get('/:id', chapterController.getChapterById);

/**
 * Admin Only Management Endpoints
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  createChapterValidator,
  validateRequest,
  chapterController.createChapter
);

router.put(
  '/reorder',
  authenticate,
  authorize('ADMIN'),
  chapterController.reorderChapters
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  updateChapterValidator,
  validateRequest,
  chapterController.updateChapter
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  chapterController.deleteChapter
);

export default router;
