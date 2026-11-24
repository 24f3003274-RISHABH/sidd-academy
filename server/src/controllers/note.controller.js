import fs from 'fs';
import os from 'os';
import path from 'path';
import { noteService } from '../services/note.service.js';
import { noteRepository } from '../repositories/note.repository.js';
import { googleDriveService } from '../services/googleDrive.service.js';
import { NOTES_UPLOAD_DIR } from '../middleware/upload.middleware.js';
import { sendSuccess, AppError } from '../utils/apiResponse.js';

/**
 * Verify that an uploaded Buffer has valid PDF magic bytes (%PDF-)
 */
const assertValidPdfBuffer = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 5) {
    throw new AppError('Uploaded PDF file is empty or invalid.', 400);
  }
  const header = buffer.subarray(0, 5).toString('utf8');
  if (!header.startsWith('%PDF-')) {
    throw new AppError('Invalid file signature: Only genuine PDF documents (.pdf) are allowed.', 400);
  }
};

/**
 * Optionally mirror an uploaded PDF buffer to Google Drive when credentials are configured
 */
const tryMirrorBufferToDrive = async (buffer, { fileName, title }) => {
  const hasToken = Boolean(process.env.GOOGLE_DRIVE_ACCESS_TOKEN);
  if (!hasToken) {
    return {};
  }
  const tmpPath = path.join(os.tmpdir(), `sidd-note-${Date.now()}-${Math.round(Math.random() * 1e6)}.pdf`);
  try {
    fs.writeFileSync(tmpPath, buffer);
    const meta = await googleDriveService.uploadFileToDrive(tmpPath, { fileName, title });
    return meta && meta.driveFileId ? meta : {};
  } catch {
    return {};
  } finally {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {}
  }
};

/**
 * Resolve local disk PDF file if present (for bundled seed PDFs or Drive cache)
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

  if (accessData.driveFileId) {
    const cacheFileName = `gdrive-${accessData.driveFileId}.pdf`;
    const cachePath = path.join(NOTES_UPLOAD_DIR, cacheFileName);
    if (fs.existsSync(cachePath)) {
      return cachePath;
    }
  }

  return null;
};

/**
 * GET /api/v1/notes
 */
export const getAllNotes = async (req, res, next) => {
  try {
    const { courseId, subjectId, chapterId, lessonId, isFree, search, isPublished, page = 1, limit = 50 } = req.query;
    const isAdmin = (req.user?.role || '').toLowerCase() === 'admin';
    const effectiveIsPublished =
      isPublished !== undefined
        ? (isPublished === 'true' || isPublished === true)
        : (isAdmin ? null : true);

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
 * GET /api/v1/notes/:id/stream
 * Streams actual PDF bytes inline (never returns raw JSON inside an iframe!).
 */
export const streamNote = async (req, res, next) => {
  try {
    const accessData = await noteService.getSecureNoteAccess(req.params.id, req.user);
    const safeName = (accessData.fileName || 'study-material.pdf').replace(/["\r\n]/g, '_');

    // 1. Durable PostgreSQL / memory binary storage (primary for Render & Vercel)
    const binary = await noteRepository.getFileBinary(accessData.id);
    if (binary && binary.buffer && binary.buffer.length > 0) {
      res.setHeader('Content-Type', binary.mimeType || 'application/pdf');
      res.setHeader('Content-Length', binary.buffer.length);
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, max-age=300');
      return res.status(200).send(binary.buffer);
    }

    // 2. Bundled local uploads fallback (for seeded notes)
    const localPath = await resolveLocalOrDrivePdfPath(accessData);
    if (localPath && fs.existsSync(localPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.sendFile(localPath);
    }

    // 3. Server-side HTTPS proxy for publicly shared Google Drive PDFs (avoids third-party cookie wall in iframes)
    if (accessData.driveFileId) {
      const drivePdfBuffer = await googleDriveService.fetchPublicDrivePdfBuffer(accessData.driveFileId);
      if (drivePdfBuffer) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', drivePdfBuffer.length);
        res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'private, max-age=300');
        return res.status(200).send(drivePdfBuffer);
      }

      // Google Drive file is private or unreachable from server — return clear structured status (never redirect XHR to cookie wall)
      return res.status(422).json({
        success: false,
        code: 'DRIVE_DIRECT_OPEN_REQUIRED',
        message: 'This Google Drive study material cannot be embedded directly because Google Drive requires opening it in its own tab. Use "Open in Google Drive" below, or upload the PDF directly in Admin.',
        data: {
          driveViewUrl: accessData.driveViewUrl,
          driveDownloadUrl: accessData.driveDownloadUrl,
        },
      });
    }

    if (accessData.fileUrl && (accessData.fileUrl.startsWith('http://') || accessData.fileUrl.startsWith('https://'))) {
      return res.redirect(accessData.fileUrl);
    }

    // Never return HTTP 200 JSON on /stream — return a real 404 error so the viewer shows a proper message
    return next(
      new AppError(
        'This PDF file is no longer available on the server. Please ask the administrator to re-upload this study material.',
        404
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/notes/:id/download
 * Streams PDF as attachment download (or proxies public Google Drive PDF bytes).
 */
export const downloadNote = async (req, res, next) => {
  try {
    const accessData = await noteService.getSecureNoteAccess(req.params.id, req.user);
    const safeName = (accessData.fileName || 'study-material.pdf').replace(/["\r\n]/g, '_');

    // 1. Durable PostgreSQL / memory binary storage
    const binary = await noteRepository.getFileBinary(accessData.id);
    if (binary && binary.buffer && binary.buffer.length > 0) {
      res.setHeader('Content-Type', binary.mimeType || 'application/pdf');
      res.setHeader('Content-Length', binary.buffer.length);
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.status(200).send(binary.buffer);
    }

    // 2. Local bundled file fallback
    const localPath = await resolveLocalOrDrivePdfPath(accessData);
    if (localPath && fs.existsSync(localPath)) {
      return res.download(localPath, safeName);
    }

    // 3. Server-side HTTPS proxy for publicly shared Google Drive PDFs
    if (accessData.driveFileId) {
      const drivePdfBuffer = await googleDriveService.fetchPublicDrivePdfBuffer(accessData.driveFileId);
      if (drivePdfBuffer) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', drivePdfBuffer.length);
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.status(200).send(drivePdfBuffer);
      }
    }

    // 4. External Google Drive / HTTPS URL fallback
    if (accessData.driveDownloadUrl) {
      return res.redirect(accessData.driveDownloadUrl);
    }
    if (accessData.fileUrl && (accessData.fileUrl.startsWith('http://') || accessData.fileUrl.startsWith('https://'))) {
      return res.redirect(accessData.fileUrl);
    }

    return next(
      new AppError(
        'This PDF file is not available for download yet. Please ask the administrator to re-upload it.',
        404
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/notes
 * Admin create new study note (persists PDF bytes durably in PostgreSQL + optional Google Drive mirror)
 */
export const createNote = async (req, res, next) => {
  try {
    let fileUrl = req.body.fileUrl || '';
    let fileName = req.body.fileName;
    let fileSize = req.body.fileSize;
    let fileData = null;
    let fileMime = 'application/pdf';
    let driveMeta = {};

    if (req.file && req.file.buffer) {
      assertValidPdfBuffer(req.file.buffer);
      fileData = req.file.buffer;
      fileMime = 'application/pdf';
      fileName = req.file.originalname || 'study-material.pdf';
      fileSize = `${Math.max(0.01, req.file.size / (1024 * 1024)).toFixed(2)} MB`;

      // Optional mirror to Google Drive if token is configured
      driveMeta = await tryMirrorBufferToDrive(req.file.buffer, {
        fileName,
        title: req.body.title,
      });

      if (driveMeta.driveViewUrl) {
        fileUrl = driveMeta.driveViewUrl;
      }
    }

    if (!fileData && !fileUrl.trim()) {
      return next(new AppError('Please upload a PDF file or provide a valid Google Drive / PDF URL.', 400));
    }

    const note = await noteService.createNote({
      ...req.body,
      fileUrl,
      fileName,
      fileSize,
      fileData,
      fileMime,
      storageProvider: fileData ? (driveMeta.driveFileId ? 'database+gdrive' : 'database') : undefined,
      ...driveMeta,
    });

    return sendSuccess(res, 201, 'Study material uploaded and saved successfully', { note });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/notes/:id
 * Admin update note metadata (and optionally replace PDF binary durably)
 */
export const updateNote = async (req, res, next) => {
  try {
    const updatePayload = { ...req.body };

    if (req.file && req.file.buffer) {
      assertValidPdfBuffer(req.file.buffer);
      const fileName = req.file.originalname || 'study-material.pdf';
      const fileSize = `${Math.max(0.01, req.file.size / (1024 * 1024)).toFixed(2)} MB`;

      const driveMeta = await tryMirrorBufferToDrive(req.file.buffer, {
        fileName,
        title: req.body.title,
      });

      Object.assign(updatePayload, {
        fileData: req.file.buffer,
        fileMime: 'application/pdf',
        fileName,
        fileSize,
        storageProvider: driveMeta.driveFileId ? 'database+gdrive' : 'database',
        ...(driveMeta.driveViewUrl ? { fileUrl: driveMeta.driveViewUrl } : {}),
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
 */
export const deleteNote = async (req, res, next) => {
  try {
    await noteService.deleteNote(req.params.id);
    return sendSuccess(res, 200, 'Note deleted successfully');
  } catch (error) {
    next(error);
  }
};
