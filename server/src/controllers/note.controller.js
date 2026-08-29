import { noteService } from '../services/note.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Controller for Digital Notes & Study Materials
 */

/**
 * GET /api/v1/notes
 * Public listing of digital notes with free/paid status & locked resource indicators
 */
export const getAllNotes = async (req, res, next) => {
  try {
    const { courseId, subjectId, chapterId, isFree, search, page = 1, limit = 50 } = req.query;
    const notes = await noteService.getNotes(
      { courseId, subjectId, chapterId, isFree, search, isPublished: true, page, limit },
      req.user
    );

    return sendSuccess(res, 200, 'Notes fetched successfully', {
      notes,
      total: notes.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/notes/:id
 * Retrieve single note metadata
 */
export const getNoteById = async (req, res, next) => {
  try {
    const note = await noteService.getNoteById(req.params.id, req.user);
    return sendSuccess(res, 200, 'Note details fetched successfully', { note });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/notes/:id/access
 * Authenticated access verification endpoint
 * Returns secure file URL if user is entitled; throws 403 Forbidden otherwise
 */
export const getSecureAccess = async (req, res, next) => {
  try {
    const accessData = await noteService.getSecureNoteAccess(req.params.id, req.user);
    return sendSuccess(res, 200, 'Note access authorized', accessData);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/notes/:id/download
 * Authenticated download verification endpoint
 */
export const downloadNote = async (req, res, next) => {
  try {
    const accessData = await noteService.getSecureNoteAccess(req.params.id, req.user);
    
    // If it's an external web URL, redirect
    if (accessData.fileUrl && (accessData.fileUrl.startsWith('http://') || accessData.fileUrl.startsWith('https://'))) {
      return res.redirect(accessData.fileUrl);
    }

    // Default safe response
    return sendSuccess(res, 200, 'Download access granted', accessData);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/notes
 * Admin create new study note
 */
export const createNote = async (req, res, next) => {
  try {
    let fileUrl = req.body.fileUrl;
    let fileName = req.body.fileName;
    let fileSize = req.body.fileSize;

    if (req.file) {
      fileUrl = `/uploads/notes/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`;
    }

    const note = await noteService.createNote({
      ...req.body,
      fileUrl,
      fileName,
      fileSize,
    });

    return sendSuccess(res, 201, 'Note created successfully', { note });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/notes/:id
 * Admin update note metadata
 */
export const updateNote = async (req, res, next) => {
  try {
    const note = await noteService.updateNote(req.params.id, req.body);
    return sendSuccess(res, 200, 'Note updated successfully', { note });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/notes/:id
 * Admin delete note
 */
export const deleteNote = async (req, res, next) => {
  try {
    await noteService.deleteNote(req.params.id);
    return sendSuccess(res, 200, 'Note deleted successfully');
  } catch (error) {
    next(error);
  }
};
