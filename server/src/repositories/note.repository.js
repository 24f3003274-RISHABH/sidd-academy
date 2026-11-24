import { query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';
import { googleDriveService } from '../services/googleDrive.service.js';

const isUuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

/**
 * Note Repository - PostgreSQL Data Access Layer with MockStore Resilient Fallback
 * and Google Drive Study Material Metadata Support
 */
export class NoteRepository {
  constructor() {
    this.normalizeNote = this.normalizeNote.bind(this);
  }

  /**
   * Resolve hierarchy titles & parent courseId from mockStore when not explicitly set on row
   */
  resolveHierarchyFromMock(row) {
    let courseId = row.course_id || row.courseId || row.course || null;
    let subjectId = row.subject_id || row.subjectId || null;
    let chapterId = row.chapter_id || row.chapterId || row.chapter || null;
    const lessonId = row.lesson_id || row.lessonId || row.lesson || null;

    if (lessonId && !chapterId) {
      const lesson = (mockData.dailyClasses || []).find(l => l.id === lessonId || l._id === lessonId);
      if (lesson) chapterId = lesson.chapterId || lesson.chapter || null;
    }
    if (chapterId && !subjectId) {
      const chap = (mockData.chapters || []).find(c => c.id === chapterId || c._id === chapterId);
      if (chap) {
        subjectId = chap.subjectId || chap.subject || null;
        if (!courseId && chap.courseId) courseId = chap.courseId;
      }
    }
    if (subjectId && !courseId) {
      const subj = (mockData.subjects || []).find(s => s.id === subjectId || s._id === subjectId);
      if (subj) courseId = subj.courseId || subj.course || null;
    }

    const courseObj = courseId ? (mockData.courses || []).find(c => c.id === courseId || c._id === courseId || c.slug === courseId) : null;
    const subjObj = subjectId ? (mockData.subjects || []).find(s => s.id === subjectId || s._id === subjectId) : null;
    const chapObj = chapterId ? (mockData.chapters || []).find(c => c.id === chapterId || c._id === chapterId) : null;

    return {
      courseId: courseObj ? (courseObj.id || courseObj._id) : courseId,
      subjectId,
      chapterId,
      lessonId,
      courseTitle: row.course_title || row.courseTitle || courseObj?.title || '',
      subjectTitle: row.subject_title || row.subjectTitle || subjObj?.name || subjObj?.title || (typeof row.subject === 'string' ? row.subject : '') || 'Study Material',
      chapterTitle: row.chapter_title || row.chapterTitle || chapObj?.title || '',
    };
  }

  normalizeNote(row) {
    if (!row) return null;
    const hierarchy = this.resolveHierarchyFromMock(row);
    const rawFileUrl = row.file_url || row.fileUrl || '';
    const driveFileId =
      row.drive_file_id ||
      row.driveFileId ||
      googleDriveService.extractDriveFileId(row.drive_view_url || row.driveViewUrl || rawFileUrl);
    const driveUrls = googleDriveService.buildDriveUrls(driveFileId);
    const downloadCount = Number(row.download_count ?? row.downloadCount ?? row.downloadsCount ?? 0);

    return {
      id: row.id || row._id,
      _id: row.id || row._id,
      title: row.title,
      description: row.description || '',
      courseId: hierarchy.courseId,
      subjectId: hierarchy.subjectId,
      chapterId: hierarchy.chapterId,
      lessonId: hierarchy.lessonId,
      courseTitle: hierarchy.courseTitle,
      subjectTitle: hierarchy.subjectTitle,
      subjectName: hierarchy.subjectTitle,
      subject: hierarchy.subjectTitle,
      chapterTitle: hierarchy.chapterTitle,
      fileUrl: rawFileUrl || driveUrls.driveViewUrl || '',
      localFileUrl: row.local_file_url || row.localFileUrl || (rawFileUrl.startsWith('/uploads/') ? rawFileUrl : ''),
      fileName: row.file_name || row.fileName || 'note.pdf',
      fileSize: row.file_size || row.fileSize || '2.5 MB',
      driveFileId: driveFileId || null,
      driveFolderId: row.drive_folder_id || row.driveFolderId || ENV.GOOGLE_DRIVE_FOLDER_ID || '1axziJZcQmDY1Ptbkm8s3c1ZJYStrL7Rf',
      driveViewUrl: row.drive_view_url || row.driveViewUrl || driveUrls.driveViewUrl || null,
      drivePreviewUrl: row.drive_preview_url || row.drivePreviewUrl || driveUrls.drivePreviewUrl || null,
      driveDownloadUrl: row.driveDownloadUrl || driveUrls.driveDownloadUrl || null,
      storageProvider: driveFileId ? 'gdrive' : (row.storage_provider || row.storageProvider || 'local'),
      thumbnail: row.thumbnail || row.thumbnail_url || 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80',
      price: typeof row.price === 'string' ? parseFloat(row.price) : (row.price ?? 0),
      isFree: Boolean(row.is_free ?? row.isFree),
      isPublished: Boolean(row.is_published ?? row.isPublished ?? true),
      pageCount: Number(row.page_count ?? row.pageCount ?? 1),
      downloadCount,
      downloadsCount: downloadCount,
      createdAt: row.created_at || row.createdAt || new Date(),
      updatedAt: row.updated_at || row.updatedAt || new Date(),
    };
  }

  /**
   * Find notes with filtering, pagination and search
   */
  async findAll({ courseId, subjectId, chapterId, lessonId, isFree, search, isPublished = true, page = 1, limit = 50 } = {}) {
    const offset = (Number(page) - 1) * Number(limit);

    if (ENV.DATABASE_URL) {
      try {
        let sql = `
          SELECT n.*,
                 c.title as course_title,
                 COALESCE(s.name, s.title) as subject_title,
                 ch.title as chapter_title
          FROM notes n
          LEFT JOIN lessons l ON n.lesson_id = l.id
          LEFT JOIN chapters ch ON COALESCE(n.chapter_id, l.chapter_id) = ch.id
          LEFT JOIN subjects s ON COALESCE(n.subject_id, ch.subject_id) = s.id
          LEFT JOIN courses c ON COALESCE(n.course_id, s.course_id) = c.id
          WHERE 1=1
        `;
        const params = [];
        let pIndex = 1;

        if (isPublished !== undefined && isPublished !== null) {
          sql += ` AND n.is_published = $${pIndex++}`;
          params.push(Boolean(isPublished));
        }

        if (courseId) {
          if (isUuid(courseId)) {
            sql += ` AND (n.course_id = $${pIndex} OR s.course_id = $${pIndex} OR c.id = $${pIndex})`;
          } else {
            sql += ` AND c.slug = $${pIndex}`;
          }
          params.push(courseId);
          pIndex++;
        }

        if (subjectId && isUuid(subjectId)) {
          sql += ` AND (n.subject_id = $${pIndex} OR ch.subject_id = $${pIndex})`;
          params.push(subjectId);
          pIndex++;
        }

        if (chapterId && isUuid(chapterId)) {
          sql += ` AND (n.chapter_id = $${pIndex} OR l.chapter_id = $${pIndex})`;
          params.push(chapterId);
          pIndex++;
        }

        if (lessonId && isUuid(lessonId)) {
          sql += ` AND n.lesson_id = $${pIndex++}`;
          params.push(lessonId);
        }

        if (isFree !== undefined && isFree !== null && isFree !== '') {
          sql += ` AND n.is_free = $${pIndex++}`;
          params.push(isFree === 'true' || isFree === true);
        }

        if (search) {
          sql += ` AND (n.title ILIKE $${pIndex} OR n.description ILIKE $${pIndex})`;
          params.push(`%${search}%`);
          pIndex++;
        }

        sql += ` ORDER BY n.created_at DESC LIMIT $${pIndex++} OFFSET $${pIndex++}`;
        params.push(Number(limit), offset);

        const res = await query(sql, params);
        return res.rows.map(this.normalizeNote);
      } catch (err) {
        console.warn('NoteRepository findAll fallback to mockStore:', err.message);
      }
    }

    // In-Memory fallback
    let filtered = (mockData.notes || []).map(this.normalizeNote);

    if (isPublished !== undefined && isPublished !== null) {
      const pubBool = isPublished === 'true' || isPublished === true;
      filtered = filtered.filter(n => (n.isPublished ?? true) === pubBool);
    }
    if (courseId) {
      const targetCourse = (mockData.courses || []).find(c => c.id === courseId || c._id === courseId || c.slug === courseId);
      const targetCourseId = targetCourse ? (targetCourse.id || targetCourse._id) : courseId;
      filtered = filtered.filter(n => n.courseId === targetCourseId || n.courseId === courseId);
    }
    if (subjectId) {
      filtered = filtered.filter(n => n.subjectId === subjectId || n.subject === subjectId);
    }
    if (chapterId) {
      filtered = filtered.filter(n => n.chapterId === chapterId);
    }
    if (lessonId) {
      filtered = filtered.filter(n => n.lessonId === lessonId);
    }
    if (isFree !== undefined && isFree !== null && isFree !== '') {
      const freeBool = isFree === 'true' || isFree === true;
      filtered = filtered.filter(n => Boolean(n.isFree) === freeBool);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(n =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.description && n.description.toLowerCase().includes(q)) ||
        (n.subjectTitle && n.subjectTitle.toLowerCase().includes(q))
      );
    }

    return filtered.slice(offset, offset + Number(limit));
  }

  /**
   * Find single note by ID
   */
  async findById(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL && isUuid(id)) {
      try {
        const sql = `
          SELECT n.*,
                 c.title as course_title,
                 COALESCE(s.name, s.title) as subject_title,
                 ch.title as chapter_title
          FROM notes n
          LEFT JOIN lessons l ON n.lesson_id = l.id
          LEFT JOIN chapters ch ON COALESCE(n.chapter_id, l.chapter_id) = ch.id
          LEFT JOIN subjects s ON COALESCE(n.subject_id, ch.subject_id) = s.id
          LEFT JOIN courses c ON COALESCE(n.course_id, s.course_id) = c.id
          WHERE n.id = $1
          LIMIT 1
        `;
        const res = await query(sql, [id]);
        if (res.rows.length > 0) {
          return this.normalizeNote(res.rows[0]);
        }
      } catch (err) {
        console.warn('NoteRepository findById fallback to mockStore:', err.message);
      }
    }

    const note = (mockData.notes || []).find(n => n._id === id || n.id === id);
    return note ? this.normalizeNote(note) : null;
  }

  /**
   * Create a new note
   */
  async create(data) {
    const id = uuidv4();
    const isFree = data.isFree === true || data.isFree === 'true' || Number(data.price || 0) === 0;
    const price = isFree ? 0 : Number(data.price || 0);
    const isPublished = data.isPublished !== undefined ? (data.isPublished === true || data.isPublished === 'true') : true;

    const hierarchy = this.resolveHierarchyFromMock(data);
    const driveFileId = data.driveFileId || googleDriveService.extractDriveFileId(data.driveViewUrl || data.fileUrl);
    const driveUrls = googleDriveService.buildDriveUrls(driveFileId);
    const effectiveFileUrl = data.fileUrl || driveUrls.driveViewUrl || data.localFileUrl || '';

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          INSERT INTO notes (
            id, title, description, course_id, subject_id, chapter_id, lesson_id,
            file_url, file_name, file_size, thumbnail, price, is_free, is_published, page_count, download_count
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0)
          RETURNING *
        `;
        const params = [
          id,
          data.title,
          data.description || '',
          isUuid(hierarchy.courseId) ? hierarchy.courseId : null,
          isUuid(hierarchy.subjectId) ? hierarchy.subjectId : null,
          isUuid(hierarchy.chapterId) ? hierarchy.chapterId : null,
          isUuid(hierarchy.lessonId) ? hierarchy.lessonId : null,
          effectiveFileUrl,
          data.fileName || 'note.pdf',
          data.fileSize || '2.5 MB',
          data.thumbnail || '',
          price,
          isFree,
          isPublished,
          Number(data.pageCount || 1),
        ];

        const res = await query(sql, params);
        const row = {
          ...res.rows[0],
          driveFileId,
          driveFolderId: data.driveFolderId || ENV.GOOGLE_DRIVE_FOLDER_ID,
          driveViewUrl: data.driveViewUrl || driveUrls.driveViewUrl,
          drivePreviewUrl: data.drivePreviewUrl || driveUrls.drivePreviewUrl,
          localFileUrl: data.localFileUrl || '',
          storageProvider: driveFileId ? 'gdrive' : (data.storageProvider || 'local'),
        };
        return this.normalizeNote(row);
      } catch (err) {
        console.warn('NoteRepository create fallback to mockStore:', err.message);
      }
    }

    const mockNote = {
      _id: id,
      id,
      title: data.title,
      description: data.description || '',
      courseId: hierarchy.courseId || null,
      subjectId: hierarchy.subjectId || null,
      chapterId: hierarchy.chapterId || null,
      lessonId: hierarchy.lessonId || null,
      courseTitle: hierarchy.courseTitle,
      subjectTitle: hierarchy.subjectTitle,
      chapterTitle: hierarchy.chapterTitle,
      fileUrl: effectiveFileUrl,
      localFileUrl: data.localFileUrl || (effectiveFileUrl.startsWith('/uploads/') ? effectiveFileUrl : ''),
      fileName: data.fileName || 'note.pdf',
      fileSize: data.fileSize || '2.5 MB',
      driveFileId: driveFileId || null,
      driveFolderId: data.driveFolderId || ENV.GOOGLE_DRIVE_FOLDER_ID || '1axziJZcQmDY1Ptbkm8s3c1ZJYStrL7Rf',
      driveViewUrl: data.driveViewUrl || driveUrls.driveViewUrl || null,
      drivePreviewUrl: data.drivePreviewUrl || driveUrls.drivePreviewUrl || null,
      driveDownloadUrl: driveUrls.driveDownloadUrl || null,
      storageProvider: driveFileId ? 'gdrive' : (data.storageProvider || 'local'),
      thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80',
      price,
      isFree,
      isPublished,
      pageCount: Number(data.pageCount || 1),
      downloadCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!mockData.notes) mockData.notes = [];
    mockData.notes.unshift(mockNote);
    return this.normalizeNote(mockNote);
  }

  /**
   * Update an existing note
   */
  async update(id, data) {
    if (!id) return null;

    if (ENV.DATABASE_URL && isUuid(id)) {
      try {
        const fields = [];
        const params = [];
        let pIndex = 1;

        if (data.title !== undefined) { fields.push(`title = $${pIndex++}`); params.push(data.title); }
        if (data.description !== undefined) { fields.push(`description = $${pIndex++}`); params.push(data.description); }
        if (data.courseId !== undefined) { fields.push(`course_id = $${pIndex++}`); params.push(isUuid(data.courseId) ? data.courseId : null); }
        if (data.subjectId !== undefined) { fields.push(`subject_id = $${pIndex++}`); params.push(isUuid(data.subjectId) ? data.subjectId : null); }
        if (data.chapterId !== undefined) { fields.push(`chapter_id = $${pIndex++}`); params.push(isUuid(data.chapterId) ? data.chapterId : null); }
        if (data.lessonId !== undefined) { fields.push(`lesson_id = $${pIndex++}`); params.push(isUuid(data.lessonId) ? data.lessonId : null); }
        if (data.fileUrl !== undefined) { fields.push(`file_url = $${pIndex++}`); params.push(data.fileUrl); }
        if (data.fileName !== undefined) { fields.push(`file_name = $${pIndex++}`); params.push(data.fileName); }
        if (data.fileSize !== undefined) { fields.push(`file_size = $${pIndex++}`); params.push(data.fileSize); }
        if (data.thumbnail !== undefined) { fields.push(`thumbnail = $${pIndex++}`); params.push(data.thumbnail); }
        if (data.price !== undefined) { fields.push(`price = $${pIndex++}`); params.push(Number(data.price)); }
        if (data.isFree !== undefined) { fields.push(`is_free = $${pIndex++}`); params.push(data.isFree === true || data.isFree === 'true'); }
        if (data.isPublished !== undefined) { fields.push(`is_published = $${pIndex++}`); params.push(data.isPublished === true || data.isPublished === 'true'); }
        if (data.pageCount !== undefined) { fields.push(`page_count = $${pIndex++}`); params.push(Number(data.pageCount)); }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        if (fields.length === 1) {
          return this.findById(id);
        }

        params.push(id);
        const sql = `UPDATE notes SET ${fields.join(', ')} WHERE id = $${pIndex} RETURNING *`;
        const res = await query(sql, params);
        if (res.rows.length > 0) {
          return this.normalizeNote({ ...res.rows[0], ...data });
        }
      } catch (err) {
        console.warn('NoteRepository update fallback to mockStore:', err.message);
      }
    }

    const idx = (mockData.notes || []).findIndex(n => n._id === id || n.id === id);
    if (idx === -1) return null;

    const merged = {
      ...mockData.notes[idx],
      ...data,
      price: data.price !== undefined ? Number(data.price) : mockData.notes[idx].price,
      isFree: data.isFree !== undefined ? (data.isFree === true || data.isFree === 'true') : mockData.notes[idx].isFree,
      isPublished: data.isPublished !== undefined ? (data.isPublished === true || data.isPublished === 'true') : (mockData.notes[idx].isPublished ?? true),
      updatedAt: new Date(),
    };

    const driveFileId = merged.driveFileId || googleDriveService.extractDriveFileId(merged.driveViewUrl || merged.fileUrl);
    if (driveFileId) {
      const driveUrls = googleDriveService.buildDriveUrls(driveFileId);
      merged.driveFileId = driveFileId;
      merged.driveViewUrl = driveUrls.driveViewUrl;
      merged.drivePreviewUrl = driveUrls.drivePreviewUrl;
      merged.driveDownloadUrl = driveUrls.driveDownloadUrl;
      merged.storageProvider = 'gdrive';
    }

    mockData.notes[idx] = merged;
    return this.normalizeNote(mockData.notes[idx]);
  }

  /**
   * Count total notes with optional published filter
   */
  async count({ isPublished } = {}) {
    if (ENV.DATABASE_URL) {
      try {
        let sql = `SELECT COUNT(*) FROM notes`;
        const params = [];
        if (isPublished !== undefined) {
          sql += ` WHERE is_published = $1`;
          params.push(isPublished);
        }
        const res = await query(sql, params);
        return parseInt(res.rows[0]?.count || 0, 10);
      } catch (err) {
        console.warn('NoteRepository count fallback to mockStore:', err.message);
      }
    }

    let list = [...(mockData.notes || [])];
    if (isPublished !== undefined) {
      list = list.filter(n => (n.isPublished ?? true) === isPublished);
    }
    return list.length;
  }

  /**
   * Delete a note
   */
  async delete(id) {
    if (!id) return false;

    if (ENV.DATABASE_URL && isUuid(id)) {
      try {
        const sql = `DELETE FROM notes WHERE id = $1 RETURNING id`;
        const res = await query(sql, [id]);
        return res.rowCount > 0;
      } catch (err) {
        console.warn('NoteRepository delete fallback to mockStore:', err.message);
      }
    }

    const idx = (mockData.notes || []).findIndex(n => n._id === id || n.id === id);
    if (idx === -1) return false;
    mockData.notes.splice(idx, 1);
    return true;
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(id) {
    if (!id) return;

    if (ENV.DATABASE_URL && isUuid(id)) {
      try {
        await query(`UPDATE notes SET download_count = download_count + 1 WHERE id = $1`, [id]);
        return;
      } catch (err) {
        console.warn('NoteRepository incrementDownloadCount fallback:', err.message);
      }
    }

    const note = (mockData.notes || []).find(n => n._id === id || n.id === id);
    if (note) {
      note.downloadCount = (note.downloadCount || 0) + 1;
    }
  }

  /**
   * Check if user has purchased the note directly or is enrolled in parent course
   */
  async checkUserPurchase(userId, noteId, courseId = null) {
    if (!userId || !noteId) return false;

    let effectiveCourseId = courseId;
    if (!effectiveCourseId) {
      const note = await this.findById(noteId);
      if (note && note.courseId) {
        effectiveCourseId = note.courseId;
      }
    }

    if (ENV.DATABASE_URL && isUuid(userId) && isUuid(noteId)) {
      try {
        // 1. Direct note purchase check
        const notePurchaseSql = `SELECT id FROM note_purchases WHERE user_id = $1 AND note_id = $2 LIMIT 1`;
        const npRes = await query(notePurchaseSql, [userId, noteId]);
        if (npRes.rows.length > 0) return true;

        // 2. Course enrollment check if note is tied to a course
        if (effectiveCourseId && isUuid(effectiveCourseId)) {
          const enrollSql = `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = 'active' LIMIT 1`;
          const enrollRes = await query(enrollSql, [userId, effectiveCourseId]);
          if (enrollRes.rows.length > 0) return true;
        }
      } catch (err) {
        console.warn('NoteRepository checkUserPurchase fallback:', err.message);
      }
    }

    // MockStore check
    const hasDirect = (mockData.notePurchases || []).some(np => np.userId === userId && np.noteId === noteId);
    if (hasDirect) return true;

    if (effectiveCourseId) {
      const hasEnrollment = (mockData.enrollments || []).some(
        e => e.userId === userId && e.courseId === effectiveCourseId && (e.status || 'active') === 'active'
      );
      if (hasEnrollment) return true;
    }

    const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
    if (user) {
      if (user.purchasedNotes && user.purchasedNotes.includes(noteId)) return true;
      if (effectiveCourseId && user.purchasedCourses && user.purchasedCourses.includes(effectiveCourseId)) return true;
    }

    return false;
  }

  /**
   * Record a new note purchase
   */
  async recordPurchase(userId, noteId, orderId = null, pricePaid = 0) {
    const id = uuidv4();

    if (ENV.DATABASE_URL && isUuid(userId) && isUuid(noteId)) {
      try {
        const sql = `
          INSERT INTO note_purchases (id, user_id, note_id, order_id, price_paid)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id, note_id) DO UPDATE SET price_paid = EXCLUDED.price_paid
          RETURNING *
        `;
        const res = await query(sql, [id, userId, noteId, orderId, pricePaid]);
        return res.rows[0];
      } catch (err) {
        console.warn('NoteRepository recordPurchase fallback:', err.message);
      }
    }

    if (!mockData.notePurchases) mockData.notePurchases = [];
    const existing = mockData.notePurchases.find(np => np.userId === userId && np.noteId === noteId);
    if (existing) {
      existing.pricePaid = pricePaid;
      return existing;
    }

    const np = {
      _id: id,
      id,
      userId,
      noteId,
      orderId,
      pricePaid,
      purchasedAt: new Date(),
    };
    mockData.notePurchases.push(np);

    const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
    if (user) {
      if (!user.purchasedNotes) user.purchasedNotes = [];
      if (!user.purchasedNotes.includes(noteId)) user.purchasedNotes.push(noteId);
    }

    return np;
  }
}

export const noteRepository = new NoteRepository();
export default noteRepository;
