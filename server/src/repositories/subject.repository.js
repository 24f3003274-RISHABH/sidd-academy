import { query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Subject Repository - Data Access Layer for Academic Subjects
 */
export class SubjectRepository {
  /**
   * Find subjects by course ID
   */
  async findByCourseId(courseId) {
    if (!courseId) return [];

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT id, course_id, name, order_index, created_at, updated_at
          FROM subjects
          WHERE course_id = $1
          ORDER BY order_index ASC, created_at ASC
        `;
        const res = await query(sql, [courseId]);
        return res.rows.map(this.normalizeSubject);
      } catch (err) {
        console.warn('SubjectRepository findByCourseId fallback to mockStore:', err.message);
      }
    }

    return mockData.subjects
      .filter(s => s.course === courseId || s.courseId === courseId || s.course === courseId)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(this.normalizeSubject);
  }

  /**
   * Find subject by ID
   */
  async findById(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `SELECT * FROM subjects WHERE id = $1 LIMIT 1`;
        const res = await query(sql, [id]);
        if (res.rows.length > 0) {
          return this.normalizeSubject(res.rows[0]);
        }
      } catch (err) {
        console.warn('SubjectRepository findById fallback to mockStore:', err.message);
      }
    }

    const s = mockData.subjects.find(s => s._id === id || s.id === id);
    return s ? this.normalizeSubject(s) : null;
  }

  /**
   * Create subject
   */
  async create({ courseId, name, order = 0 }) {
    const id = uuidv4();

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          INSERT INTO subjects (id, course_id, name, order_index, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING *
        `;
        const res = await query(sql, [id, courseId, name.trim(), order]);
        return this.normalizeSubject(res.rows[0]);
      } catch (err) {
        console.warn('SubjectRepository create fallback to mockStore:', err.message);
      }
    }

    const memoryId = `subject_${Date.now()}`;
    const newSubj = {
      _id: memoryId,
      id: memoryId,
      course: courseId,
      courseId,
      name: name.trim(),
      order: Number(order) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockData.subjects.push(newSubj);
    return this.normalizeSubject(newSubj);
  }

  /**
   * Update subject
   */
  async update(id, updates) {
    if (ENV.DATABASE_URL) {
      try {
        const fields = [];
        const values = [id];
        let pIndex = 2;

        if (updates.name !== undefined) {
          fields.push(`name = $${pIndex++}`);
          values.push(updates.name.trim());
        }
        if (updates.order !== undefined) {
          fields.push(`order_index = $${pIndex++}`);
          values.push(Number(updates.order));
        }
        fields.push(`updated_at = NOW()`);

        const sql = `UPDATE subjects SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
        const res = await query(sql, values);
        if (res.rows.length > 0) {
          return this.normalizeSubject(res.rows[0]);
        }
      } catch (err) {
        console.warn('SubjectRepository update fallback to mockStore:', err.message);
      }
    }

    const s = mockData.subjects.find(item => item._id === id || item.id === id);
    if (!s) return null;

    if (updates.name !== undefined) s.name = updates.name.trim();
    if (updates.order !== undefined) s.order = Number(updates.order);
    s.updatedAt = new Date().toISOString();

    return this.normalizeSubject(s);
  }

  /**
   * Reorder multiple subjects in batch
   */
  async reorder(orders) {
    // orders: [{ id, order }]
    for (const item of orders) {
      await this.update(item.id, { order: item.order });
    }
    return true;
  }

  /**
   * Delete subject
   */
  async delete(id) {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `DELETE FROM subjects WHERE id = $1 RETURNING id`;
        const res = await query(sql, [id]);
        return res.rows.length > 0;
      } catch (err) {
        console.warn('SubjectRepository delete fallback to mockStore:', err.message);
      }
    }

    const idx = mockData.subjects.findIndex(s => s._id === id || s.id === id);
    if (idx !== -1) {
      mockData.subjects.splice(idx, 1);
      return true;
    }
    return false;
  }

  normalizeSubject(s) {
    if (!s) return null;
    const id = s.id || s._id;
    const courseId = s.course_id || s.courseId || s.course;
    return {
      id,
      _id: id,
      courseId,
      course: courseId,
      name: s.name,
      order: s.order_index !== undefined ? Number(s.order_index) : (s.order !== undefined ? Number(s.order) : 0),
      order_index: s.order_index !== undefined ? Number(s.order_index) : (s.order !== undefined ? Number(s.order) : 0),
      createdAt: s.created_at || s.createdAt,
      updatedAt: s.updated_at || s.updatedAt,
    };
  }
}

export const subjectRepository = new SubjectRepository();
export default subjectRepository;
