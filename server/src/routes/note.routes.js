import express from 'express';
import { protect, authorize, optionalAuth } from '../middleware/auth.middleware.js';
import { uploadPDF } from '../middleware/upload.middleware.js';
import { validateCreateNote, validateUpdateNote, validateNoteQuery } from '../validators/note.validator.js';
import * as noteController from '../controllers/note.controller.js';

const router = express.Router();

// Public & Student Endpoints
router.get('/', optionalAuth, validateNoteQuery, noteController.getAllNotes);
router.get('/:id', optionalAuth, noteController.getNoteById);
router.get('/:id/access', optionalAuth, noteController.getSecureAccess);
router.get('/:id/download', optionalAuth, noteController.downloadNote);

// Admin Management Endpoints
router.post('/', protect, authorize('ADMIN'), uploadPDF.single('file'), validateCreateNote, noteController.createNote);
router.put('/:id', protect, authorize('ADMIN'), validateUpdateNote, noteController.updateNote);
router.delete('/:id', protect, authorize('ADMIN'), noteController.deleteNote);

export default router;
