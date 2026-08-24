import express from 'express';
import { protect, adminOnly, optionalAuth } from '../middleware/auth.middleware.js';
import { uploadPDF } from '../middleware/upload.middleware.js';
import * as noteController from '../controllers/note.controller.js';

const router = express.Router();

router.get('/', optionalAuth, noteController.getAllNotes);
router.get('/:id', optionalAuth, noteController.getNoteById);
router.get('/:id/download', protect, noteController.downloadNote);

router.post('/', protect, adminOnly, uploadPDF.single('file'), noteController.createNote);
router.put('/:id', protect, adminOnly, noteController.updateNote);
router.delete('/:id', protect, adminOnly, noteController.deleteNote);

export default router;
