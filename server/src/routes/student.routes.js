import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { studentController } from '../controllers/student.controller.js';

const router = express.Router();

// All student routes require authentication
router.use(protect);

// Student Dashboard Data
router.get('/dashboard', studentController.getDashboard);
router.get('/courses', studentController.getEnrolledCourses);
router.get('/notes', studentController.getPurchasedNotes);
router.get('/progress/:courseId', studentController.getCourseProgress);
router.post('/progress', studentController.updateLessonProgress);

export default router;
