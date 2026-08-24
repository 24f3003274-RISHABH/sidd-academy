import express from 'express';
import { protect, adminOnly, optionalAuth } from '../middleware/auth.middleware.js';
import * as dailyClassController from '../controllers/dailyClass.controller.js';

const router = express.Router();

router.get('/chapter/:chapterId', optionalAuth, dailyClassController.getClassesByChapter);
router.get('/:id', optionalAuth, dailyClassController.getDailyClassById);

router.post('/', protect, adminOnly, dailyClassController.createClass);
router.put('/:id', protect, adminOnly, dailyClassController.updateClass);
router.delete('/:id', protect, adminOnly, dailyClassController.deleteClass);

export default router;
