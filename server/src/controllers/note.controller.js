import fs from 'fs';
import path from 'path';
import { noteService } from '../services/note.service.js';
import { googleDriveService } from '../services/googleDrive.service.js';
import { NOTES_UPLOAD_DIR } from '../middleware/upload.middleware.js';
import { sendSuccess, AppError } from '../utils/apiResponse.js';

/**
 * Helper to verify that an uploaded file has valid PDF magic bytes (%PDF-)
 */
const assertValidPdfFile = (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new AppError('Uploaded file was not found.', 400);
  }
  const fd = fs.openSync(filePath, 'r');
  try {
    const buffer = Buffer.alloc(5);
    const bytesRead = fs.readSync(fd, buffer, 0, 5, 0);
    const header = buffer.subarray(0, bytesRead).toString('utf8');
    if (!header.startsWith('%PDF-')) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
      throw new AppError('Invalid file signature: Only genuine PDF documents are allowed.', 400);
    }
  } finally {
    fs.closeSync(fd);
  }
};

/**
 * Controller for Digital Notes & Study Materials (with Google Drive Integration)
 */

/**
 * GET /api/v1/notes
 * Public & Admin listing of digital notes with free/paid status & locked resource indicators
 */
export const getAllNotes = async (req, res, next) => {
  try {
    const { courseId, subjectId, chapterId, lessonId, isFree, search, isPublished, page = 1, limit = 50 } = req.query;
    const isAdmin = (req.user?.role || '').toLowerCase() === 'admin';
    const effectiveIsPublished =
      isPublished !== undefined
        ? (isPublished === 'true' || isPublished === true)
        : (isAdmin ? undefined : true);

    const notes = await noteService.getNotes(
      { courseId, subjectId, chapterId, lessonId, isFree, search, isPublished: effectiveIsPublished, page, limit },
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
 * Returns secure file URL & Google Drive metadata if user is entitled; throws 403 Forbidden otherwise
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
 * Resolve or fetch the local PDF file for a note (syncing from Google Drive if needed)
 */
const resolveLocalOrDrivePdfPath = async (accessData) => {
  const candidates = [];

  if (accessData.localFileUrl) {
    const base = path.basename(accessData.localFileUrl);
    candidates.push(path.join(NOTES_UPLOAD_DIR, base));
  }
  if (accessData.fileUrl && accessData.fileUrl.startsWith('/uploads/')) {
    const base = path.basename(accessData.fileUrl);
    candidates.push(path.join(NOTES_UPLOAD_DIR, base));
  }
  if (accessData.fileName) {
    candidates.push(path.join(NOTES_UPLOAD_DIR, path.basename(accessData.fileName)));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // If the file is stored in Google Drive, download & cache it locally on demand
  if (accessData.driveFileId) {
    const cacheFileName = `gdrive-${accessData.driveFileId}.pdf`;
    const cachePath = path.join(NOTES_UPLOAD_DIR, cacheFileName);
    if (fs.existsSync(cachePath)) {
      return cachePath;
    }
    const downloaded = await googleDriveService.downloadFileFromDrive(accessData.driveFileId, cachePath);
    if (downloaded && fs.existsSync(cachePath)) {
      return cachePath;
    }
  }

  return null;
};

/**
 * GET /api/v1/notes/:id/stream
 * Authenticated inline PDF stream (fetches from local cache or Google Drive)
 */
export const streamNote = async (req, res, next) => {
  try {
    const accessData = await noteService.getSecureNoteAccess(req.params.id, req.user);
    const localPath = await resolveLocalOrDrivePdfPath(accessData);

    if (localPath && fs.existsSync(localPath)) {
      const safeName = (accessData.fileName || 'study-material.pdf').replace(/["\r\n]/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
      return res.sendFile(localPath);
    }

    if (accessData.drivePreviewUrl) {
      return res.redirect(accessData.drivePreviewUrl);
    }
    if (accessData.fileUrl && (accessData.fileUrl.startsWith('http://') || accessData.fileUrl.startsWith('https://'))) {
      return res.redirect(accessData.fileUrl);
    }

    return sendSuccess(res, 200, 'Stream access granted', accessData);
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

    if (req.query.direct === 'true') {
      const localPath = await resolveLocalOrDrivePdfPath(accessData);
      if (localPath && fs.existsSync(localPath)) {
        const safeName = (accessData.fileName || 'study-material.pdf').replace(/["\r\n]/g, '_');
        return res.download(localPath, safeName);
      }
    }

    // If it's an external web URL (e.g. Google Drive view/download URL), redirect
    if (accessData.fileUrl && (accessData.fileUrl.startsWith('http://') || accessData.fileUrl.startsWith('https://'))) {
      return res.redirect(accessData.fileUrl);
    }

    return sendSuccess(res, 200, 'Download access granted', accessData);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/notes
 * Admin create new study note (automatically saves uploaded PDF to Google Drive)
 */
export const createNote = async (req, res, next) => {
  try {
    let fileUrl = req.body.fileUrl;
    let localFileUrl = '';
    let fileName = req.body.fileName;
    let fileSize = req.body.fileSize;
    let driveMeta = {};

    if (req.file) {
      assertValidPdfFile(req.file.path);
      localFileUrl = `/uploads/notes/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = `${Math.max(0.01, req.file.size / (1024 * 1024)).toFixed(2)} MB`;

      // Upload study material to admin's Google Drive folder
      driveMeta = await googleDriveService.uploadFileToDrive(req.file.path, {
        fileName: req.file.originalname,
        title: req.body.title,
      });

      fileUrl = driveMeta.driveViewUrl || localFileUrl;
    }

    const note = await noteService.createNote({
      ...req.body,
      fileUrl,
      localFileUrl,
      fileName,
      fileSize,
      ...driveMeta,
    });

    return sendSuccess(res, 201, 'Note created and saved to Google Drive successfully', { note });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/notes/:id
 * Admin update note metadata (and optionally upload/replace PDF in Google Drive)
 */
export const updateNote = async (req, res, next) => {
  try {
    const updatePayload = { ...req.body };

    if (req.file) {
      assertValidPdfFile(req.file.path);
      const localFileUrl = `/uploads/notes/${req.file.filename}`;
      const fileName = req.file.originalname;
      const fileSize = `${Math.max(0.01, req.file.size / (1024 * 1024)).toFixed(2)} MB`;

      const driveMeta = await googleDriveService.uploadFileToDrive(req.file.path, {
        fileName: req.file.originalname,
        title: req.body.title,
      });

      Object.assign(updatePayload, {
        localFileUrl,
        fileName,
        fileSize,
        fileUrl: driveMeta.driveViewUrl || localFileUrl,
        ...driveMeta,
      });
    }

    const note = await noteService.updateNote(req.params.id, updatePayload);
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
