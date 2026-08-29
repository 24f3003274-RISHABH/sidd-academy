import { query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Note Repository - PostgreSQL Data Access Layer with MockStore Resilient Fallback
 */
export class NoteRepository {
  normalizeNote(row) {
    if (!row) return null;
    return {
      id: row.id || row._id,
      _id: row.id || row._id,
      title: row.title,
      description: row.description || '',
      courseId: row.course_id || row.courseId || row.course,
      subjectId: row.subject_id || row.subjectId || row.subject,
      chapterId: row.chapter_id || row.chapterId || row.chapter,
      lessonId: row.lesson_id || row.lessonId || row.lesson,
      courseTitle: row.course_title || '',
      subjectTitle: row.subject_title || row.subject || '',
      chapterTitle: row.chapter_title || '',
      fileUrl: row.file_url || row.fileUrl || '',
      fileName: row.file_name || row.fileName || 'note.pdf',
      fileSize: row.file_size || row.fileSize || '2.5 MB',
      thumbnail: row.thumbnail || row.thumbnail_url || 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80',
      price: typeof row.price === 'string' ? parseFloat(row.price) : (row.price ?? 0),
      isFree: Boolean(row.is_free ?? row.isFree),
      isPublished: Boolean(row.is_published ?? row.isPublished ?? true),
      pageCount: Number(row.page_count ?? row.pageCount ?? 1),
      downloadCount: Number(row.download_count ?? row.downloadCount ?? 0),
      createdAt: row.created_at || row.createdAt || new Date(),
      updatedAt: row.updated_at || row.updatedAt || new Date(),
    };
  }

  /**
   * Find notes with filtering, pagination and search
   */
  async findAll({ courseId, subjectId, chapterId, isFree, search, isPublished = true, page = 1, limit = 50 } = {}) {
    const offset = (Number(page) - 1) * Number(limit);

    if (ENV.DATABASE_URL) {
      try {
        let sql = `
          SELECT n.id, n.title, n.description, n.course_id, n.subject_id, n.chapter_id, n.lesson_id,
                 n.file_url, n.file_name, n.file_size, n.thumbnail, n.price, n.is_free, n.is_published,
                 n.page_count, n.download_count, n.created_at, n.updated_at,
                 c.title as course_title,
                 s.name as subject_title,
                 ch.title as chapter_title
          FROM notes n
          LEFT JOIN courses c ON n.course_id = c.id
          LEFT JOIN subjects s ON n.subject_id = s.id
          LEFT JOIN chapters ch ON n.chapter_id = ch.id
          WHERE 1=1
        `;
        const params = [];
        let pIndex = 1;

        if (isPublished !== undefined && isPublished !== null) {
          sql += ` AND n.is_published = $${pIndex++}`;
          params.push(isPublished);
        }

        if (courseId) {
          sql += ` AND n.course_id = $${pIndex++}`;
          params.push(courseId);
        }

        if (subjectId) {
          sql += ` AND n.subject_id = $${pIndex++}`;
          params.push(subjectId);
        }

        if (chapterId) {
          sql += ` AND n.chapter_id = $${pIndex++}`;
          params.push(chapterId);
        }

        if (isFree !== undefined && isFree !== null) {
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
    let filtered = [...(mockData.notes || [])];

    if (isPublished !== undefined && isPublished !== null) {
      filtered = filtered.filter(n => (n.isPublished ?? true) === isPublished);
    }
    if (courseId) {
      filtered = filtered.filter(n => n.courseId === courseId || n.course === courseId);
    }
    if (subjectId) {
      filtered = filtered.filter(n => n.subjectId === subjectId || n.subject === subjectId);
    }
    if (chapterId) {
      filtered = filtered.filter(n => n.chapterId === chapterId || n.chapter === chapterId);
    }
    if (isFree !== undefined && isFree !== null) {
      const freeBool = isFree === 'true' || isFree === true;
      filtered = filtered.filter(n => Boolean(n.isFree) === freeBool);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(n => 
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.description && n.description.toLowerCase().includes(q)) ||
        (n.subject && n.subject.toLowerCase().includes(q))
      );
    }

    return filtered.slice(offset, offset + Number(limit)).map(this.normalizeNote);
  }

  /**
   * Find single note by ID
   */
  async findById(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT n.id, n.title, n.description, n.course_id, n.subject_id, n.chapter_id, n.lesson_id,
                 n.file_url, n.file_name, n.file_size, n.thumbnail, n.price, n.is_free, n.is_published,
                 n.page_count, n.download_count, n.created_at, n.updated_at,
                 c.title as course_title,
                 s.name as subject_title,
                 ch.title as chapter_title
          FROM notes n
          LEFT JOIN courses c ON n.course_id = c.id
          LEFT JOIN subjects s ON n.subject_id = s.id
          LEFT JOIN chapters ch ON n.chapter_id = ch.id
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
          data.courseId || null,
          data.subjectId || null,
          data.chapterId || null,
          data.lessonId || null,
          data.fileUrl || '',
          data.fileName || 'note.pdf',
          data.fileSize || '2.5 MB',
          data.thumbnail || '',
          price,
          isFree,
          data.isPublished !== undefined ? Boolean(data.isPublished) : true,
          Number(data.pageCount || 1),
        ];

        const res = await query(sql, params);
        return this.normalizeNote(res.rows[0]);
      } catch (err) {
        console.warn('NoteRepository create fallback to mockStore:', err.message);
      }
    }

    const mockNote = {
      _id: id,
      id,
      title: data.title,
      description: data.description || '',
      courseId: data.courseId || null,
      subjectId: data.subjectId || null,
      chapterId: data.chapterId || null,
      lessonId: data.lessonId || null,
      fileUrl: data.fileUrl || '',
      fileName: data.fileName || 'note.pdf',
      fileSize: data.fileSize || '2.5 MB',
      thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80',
      price,
      isFree,
      isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
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

    if (ENV.DATABASE_URL) {
      try {
        const fields = [];
        const params = [];
        let pIndex = 1;

        if (data.title !== undefined) { fields.push(`title = $${pIndex++}`); params.push(data.title); }
        if (data.description !== undefined) { fields.push(`description = $${pIndex++}`); params.push(data.description); }
        if (data.courseId !== undefined) { fields.push(`course_id = $${pIndex++}`); params.push(data.courseId || null); }
        if (data.subjectId !== undefined) { fields.push(`subject_id = $${pIndex++}`); params.push(data.subjectId || null); }
        if (data.chapterId !== undefined) { fields.push(`chapter_id = $${pIndex++}`); params.push(data.chapterId || null); }
        if (data.lessonId !== undefined) { fields.push(`lesson_id = $${pIndex++}`); params.push(data.lessonId || null); }
        if (data.fileUrl !== undefined) { fields.push(`file_url = $${pIndex++}`); params.push(data.fileUrl); }
        if (data.fileName !== undefined) { fields.push(`file_name = $${pIndex++}`); params.push(data.fileName); }
        if (data.fileSize !== undefined) { fields.push(`file_size = $${pIndex++}`); params.push(data.fileSize); }
        if (data.thumbnail !== undefined) { fields.push(`thumbnail = $${pIndex++}`); params.push(data.thumbnail); }
        if (data.price !== undefined) { fields.push(`price = $${pIndex++}`); params.push(Number(data.price)); }
        if (data.isFree !== undefined) { fields.push(`is_free = $${pIndex++}`); params.push(data.isFree === true || data.isFree === 'true'); }
        if (data.isPublished !== undefined) { fields.push(`is_published = $${pIndex++}`); params.push(Boolean(data.isPublished)); }
        if (data.pageCount !== undefined) { fields.push(`page_count = $${pIndex++}`); params.push(Number(data.pageCount)); }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        if (fields.length === 1) {
          return this.findById(id);
        }

        params.push(id);
        const sql = `UPDATE notes SET ${fields.join(', ')} WHERE id = $${pIndex} RETURNING *`;
        const res = await query(sql, params);
        if (res.rows.length > 0) {
          return this.normalizeNote(res.rows[0]);
        }
      } catch (err) {
        console.warn('NoteRepository update fallback to mockStore:', err.message);
      }
    }

    const idx = (mockData.notes || []).findIndex(n => n._id === id || n.id === id);
    if (idx === -1) return null;

    mockData.notes[idx] = {
      ...mockData.notes[idx],
      ...data,
      price: data.price !== undefined ? Number(data.price) : mockData.notes[idx].price,
      isFree: data.isFree !== undefined ? (data.isFree === true || data.isFree === 'true') : mockData.notes[idx].isFree,
      updatedAt: new Date(),
    };
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

    if (ENV.DATABASE_URL) {
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

    if (ENV.DATABASE_URL) {
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

    if (ENV.DATABASE_URL) {
      try {
        // 1. Direct note purchase check
        const notePurchaseSql = `SELECT id FROM note_purchases WHERE user_id = $1 AND note_id = $2 LIMIT 1`;
        const npRes = await query(notePurchaseSql, [userId, noteId]);
        if (npRes.rows.length > 0) return true;

        // 2. Course enrollment check if note is tied to a course
        if (courseId) {
          const enrollSql = `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 AND status = 'active' LIMIT 1`;
          const enrollRes = await query(enrollSql, [userId, courseId]);
          if (enrollRes.rows.length > 0) return true;
        }
      } catch (err) {
        console.warn('NoteRepository checkUserPurchase fallback:', err.message);
      }
    }

    // MockStore check
    const hasDirect = (mockData.notePurchases || []).some(np => np.userId === userId && np.noteId === noteId);
    if (hasDirect) return true;

    const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
    if (user) {
      if (user.purchasedNotes && user.purchasedNotes.includes(noteId)) return true;
      if (courseId && user.purchasedCourses && user.purchasedCourses.includes(courseId)) return true;
    }

    return false;
  }

  /**
   * Record a new note purchase
   */
  async recordPurchase(userId, noteId, orderId = null, pricePaid = 0) {
    const id = uuidv4();

    if (ENV.DATABASE_URL) {
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

    // Also update user's purchasedNotes
    const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
    if (user) {
      if (!user.purchasedNotes) user.purchasedNotes = [];
      if (!user.purchasedNotes.includes(noteId)) user.purchasedNotes.push(noteId);
    }

    return np;
  }
}

export const noteRepository = new NoteRepository();
