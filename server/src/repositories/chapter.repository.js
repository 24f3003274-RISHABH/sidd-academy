import { query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Chapter Repository - Data Access Layer for Chapters
 */
export class ChapterRepository {
  /**
   * Find chapters by subject ID
   */
  async findBySubjectId(subjectId) {
    if (!subjectId) return [];

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT id, subject_id, title, order_index, created_at, updated_at
          FROM chapters
          WHERE subject_id = $1
          ORDER BY order_index ASC, created_at ASC
        `;
        const res = await query(sql, [subjectId]);
        return res.rows.map(this.normalizeChapter);
      } catch (err) {
        console.warn('ChapterRepository findBySubjectId fallback to mockStore:', err.message);
      }
    }

    return mockData.chapters
      .filter(ch => ch.subject === subjectId || ch.subjectId === subjectId)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(this.normalizeChapter);
  }

  /**
   * Find chapter by ID
   */
  async findById(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `SELECT * FROM chapters WHERE id = $1 LIMIT 1`;
        const res = await query(sql, [id]);
        if (res.rows.length > 0) {
          return this.normalizeChapter(res.rows[0]);
        }
      } catch (err) {
        console.warn('ChapterRepository findById fallback to mockStore:', err.message);
      }
    }

    const ch = mockData.chapters.find(c => c._id === id || c.id === id);
    return ch ? this.normalizeChapter(ch) : null;
  }

  /**
   * Create chapter
   */
  async create({ subjectId, title, order = 0 }) {
    const id = uuidv4();

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          INSERT INTO chapters (id, subject_id, title, order_index, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING *
        `;
        const res = await query(sql, [id, subjectId, title.trim(), order]);
        return this.normalizeChapter(res.rows[0]);
      } catch (err) {
        console.warn('ChapterRepository create fallback to mockStore:', err.message);
      }
    }

    const memoryId = `chapter_${Date.now()}`;
    const newChap = {
      _id: memoryId,
      id: memoryId,
      subject: subjectId,
      subjectId,
      title: title.trim(),
      order: Number(order) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockData.chapters.push(newChap);
    return this.normalizeChapter(newChap);
  }

  /**
   * Update chapter
   */
  async update(id, updates) {
    if (ENV.DATABASE_URL) {
      try {
        const fields = [];
        const values = [id];
        let pIndex = 2;

        if (updates.title !== undefined) {
          fields.push(`title = $${pIndex++}`);
          values.push(updates.title.trim());
        }
        if (updates.order !== undefined) {
          fields.push(`order_index = $${pIndex++}`);
          values.push(Number(updates.order));
        }
        fields.push(`updated_at = NOW()`);

        const sql = `UPDATE chapters SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
        const res = await query(sql, values);
        if (res.rows.length > 0) {
          return this.normalizeChapter(res.rows[0]);
        }
      } catch (err) {
        console.warn('ChapterRepository update fallback to mockStore:', err.message);
      }
    }

    const ch = mockData.chapters.find(item => item._id === id || item.id === id);
    if (!ch) return null;

    if (updates.title !== undefined) ch.title = updates.title.trim();
    if (updates.order !== undefined) ch.order = Number(updates.order);
    ch.updatedAt = new Date().toISOString();

    return this.normalizeChapter(ch);
  }

  /**
   * Reorder multiple chapters
   */
  async reorder(orders) {
    for (const item of orders) {
      await this.update(item.id, { order: item.order });
    }
    return true;
  }

  /**
   * Delete chapter
   */
  async delete(id) {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `DELETE FROM chapters WHERE id = $1 RETURNING id`;
        const res = await query(sql, [id]);
        return res.rows.length > 0;
      } catch (err) {
        console.warn('ChapterRepository delete fallback to mockStore:', err.message);
      }
    }

    const idx = mockData.chapters.findIndex(c => c._id === id || c.id === id);
    if (idx !== -1) {
      mockData.chapters.splice(idx, 1);
      return true;
    }
    return false;
  }

  normalizeChapter(ch) {
    if (!ch) return null;
    const id = ch.id || ch._id;
    const subjectId = ch.subject_id || ch.subjectId || ch.subject;
    return {
      id,
      _id: id,
      subjectId,
      subject: subjectId,
      title: ch.title,
      order: ch.order_index !== undefined ? Number(ch.order_index) : (ch.order !== undefined ? Number(ch.order) : 0),
      order_index: ch.order_index !== undefined ? Number(ch.order_index) : (ch.order !== undefined ? Number(ch.order) : 0),
      createdAt: ch.created_at || ch.createdAt,
      updatedAt: ch.updated_at || ch.updatedAt,
    };
  }
}

export const chapterRepository = new ChapterRepository();
export default chapterRepository;
