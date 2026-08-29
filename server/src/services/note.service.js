import { noteRepository } from '../repositories/note.repository.js';
import { courseRepository } from '../repositories/course.repository.js';
import { AppError } from '../utils/apiResponse.js';

/**
 * Note Service - Business Logic for Digital Study Materials & Access Protection
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
   * Get all notes with entitlement-aware locking and masking
   */
  async getNotes(filters = {}, user = null) {
    const notes = await noteRepository.findAll(filters);

    // Process each note for client safety
    const processed = await Promise.all(
      notes.map(async (note) => {
        const hasAccess = await this.checkUserAccess(note, user);
        const isLocked = !hasAccess;

        return {
          ...note,
          isLocked,
          // Hide actual storage path/URL if user does not own this paid resource
          fileUrl: isLocked ? null : note.fileUrl,
        };
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
    const isLocked = !hasAccess;

    return {
      ...note,
      isLocked,
      fileUrl: isLocked ? null : note.fileUrl,
    };
  }

  /**
   * Authenticated Access Verification for Note PDF
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
        'Access Denied: This is a premium study note. Please purchase this note to view or download.',
        403
      );
    }

    // Increment download counter
    await noteRepository.incrementDownloadCount(id);

    return {
      id: note.id,
      title: note.title,
      fileName: note.fileName || `${note.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      fileUrl: note.fileUrl,
      fileSize: note.fileSize,
      isFree: note.isFree,
    };
  }

  /**
   * Create a new note (Admin)
   */
  async createNote(data) {
    if (!data.title) {
      throw new AppError('Note title is required', 400);
    }

    const isFree = data.isFree === true || data.isFree === 'true' || Number(data.price || 0) === 0;
    const price = isFree ? 0 : Number(data.price || 0);

    const note = await noteRepository.create({
      ...data,
      isFree,
      price,
      fileUrl: data.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: data.fileName || `${data.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      fileSize: data.fileSize || '2.5 MB',
      pageCount: Number(data.pageCount || 1),
      isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
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

    const updated = await noteRepository.update(id, {
      ...data,
      isFree,
      price,
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
