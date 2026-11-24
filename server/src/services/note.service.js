import { noteRepository } from '../repositories/note.repository.js';
import { googleDriveService } from './googleDrive.service.js';
import { AppError } from '../utils/apiResponse.js';

/**
 * Note Service - Business Logic for Digital Study Materials, Google Drive Content & Access Protection
 */
export class NoteService {
  /**
   * Determine whether a user is entitled to view/download a note
   */
  async checkUserAccess(note, user) {
    if (!note) return false;
    // 1. Free notes are accessible to everyone
    if (note.isFree) return true;

    // 2. Unauthenticated users cannot access paid notes
    if (!user) return false;

    // 3. Admins have universal access
    const role = (user.role || '').toLowerCase();
    if (role === 'admin') return true;

    const userId = user.id || user._id;

    // 4. Check if student has purchased note or enrolled in parent course
    const hasAccess = await noteRepository.checkUserPurchase(userId, note.id || note._id, note.courseId);
    return hasAccess;
  }

  /**
   * Format note object according to entitlement (masking URLs when locked)
   */
  formatNoteForClient(note, hasAccess) {
    const isLocked = !hasAccess;
    const noteId = note.id || note._id;

    if (isLocked) {
      return {
        ...note,
        isLocked: true,
        fileUrl: null,
        localFileUrl: null,
        streamUrl: null,
        downloadUrl: null,
        driveFileId: null,
        driveViewUrl: null,
        drivePreviewUrl: null,
        driveDownloadUrl: null,
      };
    }

    return {
      ...note,
      isLocked: false,
      streamUrl: `/api/v1/notes/${noteId}/stream`,
      downloadUrl: `/api/v1/notes/${noteId}/download`,
    };
  }

  /**
   * Get all notes with entitlement-aware locking and masking
   */
  async getNotes(filters = {}, user = null) {
    const notes = await noteRepository.findAll(filters);

    const processed = await Promise.all(
      notes.map(async (note) => {
        const hasAccess = await this.checkUserAccess(note, user);
        return this.formatNoteForClient(note, hasAccess);
      })
    );

    return processed;
  }

  /**
   * Get note details by ID with entitlement check
   */
  async getNoteById(id, user = null) {
    const note = await noteRepository.findById(id);
    if (!note) {
      throw new AppError('Digital note not found', 404);
    }

    const hasAccess = await this.checkUserAccess(note, user);
    return this.formatNoteForClient(note, hasAccess);
  }

  /**
   * Authenticated Access Verification for Note PDF / Google Drive Content
   * Rejects unpurchased requests with HTTP 403 Forbidden
   */
  async getSecureNoteAccess(id, user = null) {
    const note = await noteRepository.findById(id);
    if (!note) {
      throw new AppError('Digital note not found', 404);
    }

    const hasAccess = await this.checkUserAccess(note, user);
    if (!hasAccess) {
      throw new AppError(
        'Access Denied: This is a premium study note. Please purchase this note or enroll in the course to view or download.',
        403
      );
    }

    // Increment download counter
    await noteRepository.incrementDownloadCount(id);

    const noteId = note.id || note._id;
    return {
      id: noteId,
      _id: noteId,
      title: note.title,
      fileName: note.fileName || `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      fileUrl: note.fileUrl,
      localFileUrl: note.localFileUrl || '',
      streamUrl: `/api/v1/notes/${noteId}/stream`,
      downloadUrl: `/api/v1/notes/${noteId}/download`,
      driveFileId: note.driveFileId || null,
      driveFolderId: note.driveFolderId || null,
      driveViewUrl: note.driveViewUrl || null,
      drivePreviewUrl: note.drivePreviewUrl || null,
      driveDownloadUrl: note.driveDownloadUrl || null,
      hasFileData: Boolean(note.hasFileData),
      storageProvider: note.storageProvider || (note.hasFileData ? 'database' : note.driveFileId ? 'gdrive' : 'local'),
      fileSize: note.fileSize,
      isFree: note.isFree,
    };
  }

  /**
   * Create a new note (Admin)
   */
  async createNote(data) {
    if (!data.title || !String(data.title).trim()) {
      throw new AppError('Note title is required', 400);
    }

    const isFree = data.isFree === true || data.isFree === 'true' || Number(data.price || 0) === 0;
    const price = isFree ? 0 : Number(data.price || 0);

    const extractedDriveId =
      data.driveFileId ||
      googleDriveService.extractDriveFileId(data.driveViewUrl || data.driveUrl || data.fileUrl);
    const driveUrls = googleDriveService.buildDriveUrls(extractedDriveId);
    const hasBuffer = Buffer.isBuffer(data.fileData);

    const note = await noteRepository.create({
      ...data,
      title: String(data.title).trim(),
      isFree,
      price,
      driveFileId: extractedDriveId || null,
      driveViewUrl: data.driveViewUrl || driveUrls.driveViewUrl || null,
      drivePreviewUrl: data.drivePreviewUrl || driveUrls.drivePreviewUrl || null,
      driveDownloadUrl: data.driveDownloadUrl || driveUrls.driveDownloadUrl || null,
      storageProvider: hasBuffer
        ? (extractedDriveId ? 'database+gdrive' : 'database')
        : (extractedDriveId ? 'gdrive' : (data.storageProvider || 'local')),
      fileUrl:
        data.fileUrl ||
        driveUrls.driveViewUrl ||
        data.localFileUrl ||
        '',
      fileName: data.fileName || `${String(data.title).trim().replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      fileSize: data.fileSize || '2.5 MB',
      pageCount: Number(data.pageCount || 1),
      isPublished: data.isPublished !== undefined ? (data.isPublished === true || data.isPublished === 'true') : true,
    });

    return note;
  }

  /**
   * Update an existing note (Admin)
   */
  async updateNote(id, data) {
    const existing = await noteRepository.findById(id);
    if (!existing) {
      throw new AppError('Note not found', 404);
    }

    let isFree = data.isFree !== undefined ? (data.isFree === true || data.isFree === 'true') : existing.isFree;
    let price = data.price !== undefined ? Number(data.price) : existing.price;

    if (isFree) {
      price = 0;
    }

    const extractedDriveId =
      data.driveFileId ||
      googleDriveService.extractDriveFileId(data.driveViewUrl || data.driveUrl || data.fileUrl) ||
      existing.driveFileId;
    const driveUrls = googleDriveService.buildDriveUrls(extractedDriveId);

    const hasBinary = Boolean(Buffer.isBuffer(data.fileData) || existing.hasFileData);
    const updated = await noteRepository.update(id, {
      ...data,
      isFree,
      price,
      ...(extractedDriveId
        ? {
            driveFileId: extractedDriveId,
            driveViewUrl: data.driveViewUrl || driveUrls.driveViewUrl,
            drivePreviewUrl: data.drivePreviewUrl || driveUrls.drivePreviewUrl,
            driveDownloadUrl: data.driveDownloadUrl || driveUrls.driveDownloadUrl,
            storageProvider: hasBinary ? 'database+gdrive' : 'gdrive',
          }
        : hasBinary
        ? { storageProvider: 'database' }
        : {}),
    });

    return updated;
  }

  /**
   * Delete a note (Admin)
   */
  async deleteNote(id) {
    const existing = await noteRepository.findById(id);
    if (!existing) {
      throw new AppError('Note not found', 404);
    }

    await noteRepository.delete(id);
    return true;
  }
}

export const noteService = new NoteService();
export default noteService;
