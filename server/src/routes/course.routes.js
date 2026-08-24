import express from 'express';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import { uploadImage } from '../middleware/upload.middleware.js';
import * as courseController from '../controllers/course.controller.js';

const router = express.Router();

router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.get('/:id/content', protect, courseController.getCourseContent);

router.post('/', protect, adminOnly, courseController.createCourse);
router.put('/:id', protect, adminOnly, courseController.updateCourse);
router.delete('/:id', protect, adminOnly, courseController.deleteCourse);
router.post('/:id/thumbnail', protect, adminOnly, uploadImage.single('thumbnail'), courseController.uploadCourseThumbnail);

export default router;
