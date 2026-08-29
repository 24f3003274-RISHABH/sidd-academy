import express from 'express';
import { protect, authorize, optionalAuth } from '../middleware/auth.middleware.js';
import { validateCreateVideo, validateUpdateVideo } from '../validators/video.validator.js';
import * as videoController from '../controllers/video.controller.js';

const router = express.Router();

// Public & Student Endpoints
router.get('/', optionalAuth, videoController.getAllVideos);
router.get('/:id', optionalAuth, videoController.getVideoById);
router.get('/lesson/:lessonId', optionalAuth, videoController.getVideosByLesson);

// Admin Management Endpoints
router.post('/', protect, authorize('ADMIN'), validateCreateVideo, videoController.createVideo);
router.put('/:id', protect, authorize('ADMIN'), validateUpdateVideo, videoController.updateVideo);
router.delete('/:id', protect, authorize('ADMIN'), videoController.deleteVideo);

export default router;
