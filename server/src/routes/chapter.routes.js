import express from 'express';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import * as chapterController from '../controllers/chapter.controller.js';

const router = express.Router();

router.get('/subject/:subjectId', chapterController.getChaptersBySubject);

router.post('/', protect, adminOnly, chapterController.createChapter);
router.put('/:id', protect, adminOnly, chapterController.updateChapter);
router.delete('/:id', protect, adminOnly, chapterController.deleteChapter);

export default router;
