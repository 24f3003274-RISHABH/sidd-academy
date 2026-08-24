import express from 'express';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import * as subjectController from '../controllers/subject.controller.js';

const router = express.Router();

router.get('/course/:courseId', subjectController.getSubjectsByCourse);

router.post('/', protect, adminOnly, subjectController.createSubject);
router.put('/:id', protect, adminOnly, subjectController.updateSubject);
router.delete('/:id', protect, adminOnly, subjectController.deleteSubject);

export default router;
