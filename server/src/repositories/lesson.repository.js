import { query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Lesson / Daily Class Repository - Data Access Layer for Lessons
 */
export class LessonRepository {
  /**
   * Find lessons by chapter ID
   */
  async findByChapterId(chapterId) {
    if (!chapterId) return [];

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT l.id, l.chapter_id, l.title, l.description, l.class_date, l.duration, l.class_number, l.is_free, l.is_protected, l.order_num as order_index, false as is_live, l.created_at, l.updated_at,
                 v.id as video_id, v.title as video_title, v.video_url, v.video_provider, false as is_free_preview
          FROM lessons l
          LEFT JOIN videos v ON v.lesson_id = l.id
          WHERE l.chapter_id = $1
          ORDER BY l.order_num ASC, l.class_date ASC
        `;
        const res = await query(sql, [chapterId]);
        return res.rows.map(this.normalizeLesson);
      } catch (err) {
        console.warn('LessonRepository findByChapterId fallback to mockStore:', err.message);
      }
    }

    return mockData.dailyClasses
      .filter(dc => dc.chapter === chapterId || dc.chapterId === chapterId)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(this.normalizeLesson);
  }

  /**
   * Find lesson by ID
   */
  async findById(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT l.id, l.chapter_id, l.title, l.description, l.class_date, l.duration, l.class_number, l.is_free, l.is_protected, l.order_num as order_index, false as is_live, l.created_at, l.updated_at,
                 v.id as video_id, v.title as video_title, v.video_url, v.video_provider, false as is_free_preview
          FROM lessons l
          LEFT JOIN videos v ON v.lesson_id = l.id
          WHERE l.id = $1
          LIMIT 1
        `;
        const res = await query(sql, [id]);
        if (res.rows.length > 0) {
          return this.normalizeLesson(res.rows[0]);
        }
      } catch (err) {
        console.warn('LessonRepository findById fallback to mockStore:', err.message);
      }
    }

    const dc = mockData.dailyClasses.find(item => item._id === id || item.id === id);
    return dc ? this.normalizeLesson(dc) : null;
  }

  /**
   * Create lesson
   */
  async create({ chapterId, title, description = '', classDate, duration = 60, order = 0, classNumber = 1, isLive = false, isFree = false, isProtected = true, videoUrl = '', videoProvider = 'youtube' }) {
    const id = uuidv4();
    const dateVal = classDate ? new Date(classDate).toISOString() : new Date().toISOString();
    const ord = Number(order) || 0;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          INSERT INTO lessons (id, chapter_id, title, description, class_date, class_number, duration, order_num, order_index, is_free, is_protected, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, NOW(), NOW())
          RETURNING *
        `;
        const res = await query(sql, [id, chapterId, title.trim(), description.trim(), dateVal, Number(classNumber) || 1, `${duration} mins`, ord, Boolean(isFree), Boolean(isProtected)]);
        const createdLesson = res.rows[0];

        if (videoUrl) {
          const videoId = uuidv4();
          await query(
            `INSERT INTO videos (id, lesson_id, title, video_url, video_provider, quality, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, '1080p', NOW(), NOW())`,
            [videoId, id, title.trim(), videoUrl.trim(), videoProvider || 'youtube']
          );
        }

        return this.findById(id);
      } catch (err) {
        console.warn('LessonRepository create fallback to mockStore:', err.message);
      }
    }

    const memoryId = `class_${Date.now()}`;
    const newClass = {
      _id: memoryId,
      id: memoryId,
      chapter: chapterId,
      chapterId,
      title: title.trim(),
      description: description.trim(),
      classDate: dateVal,
      classNumber: Number(classNumber) || 1,
      duration: Number(duration) || 60,
      order: ord,
      order_index: ord,
      isLive: Boolean(isLive),
      isFree: Boolean(isFree),
      isProtected: Boolean(isProtected),
      videoUrl: videoUrl.trim(),
      videoProvider: videoProvider || 'youtube',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockData.dailyClasses.push(newClass);
    return this.normalizeLesson(newClass);
  }

  /**
   * Update lesson
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
        if (updates.description !== undefined || updates.content !== undefined) {
          fields.push(`description = $${pIndex++}`);
          values.push(String(updates.description ?? updates.content ?? '').trim());
        }
        if (updates.classDate !== undefined) {
          fields.push(`class_date = $${pIndex++}`);
          values.push(new Date(updates.classDate).toISOString());
        }
        if (updates.duration !== undefined) {
          fields.push(`duration = $${pIndex++}`);
          values.push(`${Number(updates.duration)} mins`);
        }
        if (updates.order !== undefined || updates.order_index !== undefined || updates.orderNum !== undefined) {
          const ord = Number(updates.order ?? updates.order_index ?? updates.orderNum);
          fields.push(`order_num = $${pIndex++}`);
          values.push(ord);
          fields.push(`order_index = $${pIndex++}`);
          values.push(ord);
        }
        if (updates.isLive !== undefined) {
          fields.push(`is_live = $${pIndex++}`);
          values.push(Boolean(updates.isLive));
        }
        if (updates.classNumber !== undefined) {
          fields.push(`class_number = $${pIndex++}`);
          values.push(Number(updates.classNumber) || 1);
        }
        if (updates.isFree !== undefined) {
          fields.push(`is_free = $${pIndex++}`);
          values.push(Boolean(updates.isFree));
        }
        if (updates.isProtected !== undefined) {
          fields.push(`is_protected = $${pIndex++}`);
          values.push(Boolean(updates.isProtected));
        }
        fields.push(`updated_at = NOW()`);

        const sql = `UPDATE lessons SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
        await query(sql, values);

        if (updates.videoUrl !== undefined) {
          const videoRes = await query(`SELECT id FROM videos WHERE lesson_id = $1`, [id]);
          if (videoRes.rows.length > 0) {
            await query(`UPDATE videos SET video_url = $1, updated_at = NOW() WHERE lesson_id = $2`, [updates.videoUrl.trim(), id]);
          } else if (updates.videoUrl) {
            const videoId = uuidv4();
            await query(
              `INSERT INTO videos (id, lesson_id, title, video_url, video_provider, quality, is_published, created_at, updated_at)
               VALUES ($1, $2, 'Class Video', $3, 'youtube', '1080p', true, NOW(), NOW())`,
              [videoId, id, updates.videoUrl.trim()]
            );
          }
        }

        return this.findById(id);
      } catch (err) {
        console.warn('LessonRepository update fallback to mockStore:', err.message);
      }
    }

    const dc = mockData.dailyClasses.find(item => item._id === id || item.id === id);
    if (!dc) return null;

    if (updates.title !== undefined) dc.title = updates.title.trim();
    if (updates.description !== undefined || updates.content !== undefined) dc.description = String(updates.description ?? updates.content ?? '').trim();
    if (updates.classDate !== undefined) dc.classDate = new Date(updates.classDate).toISOString();
    if (updates.duration !== undefined) dc.duration = Number(updates.duration);
    if (updates.order !== undefined) dc.order = Number(updates.order);
    if (updates.isLive !== undefined) dc.isLive = Boolean(updates.isLive);
    if (updates.classNumber !== undefined) dc.classNumber = Number(updates.classNumber) || 1;
    if (updates.isFree !== undefined) dc.isFree = Boolean(updates.isFree);
    if (updates.isProtected !== undefined) dc.isProtected = Boolean(updates.isProtected);
    if (updates.videoUrl !== undefined) dc.videoUrl = updates.videoUrl.trim();
    dc.updatedAt = new Date().toISOString();

    return this.normalizeLesson(dc);
  }

  /**
   * Reorder multiple lessons
   */
  async reorder(orders) {
    for (const item of orders) {
      await this.update(item.id, { order: item.order });
    }
    return true;
  }

  /**
   * Delete lesson
   */
  async delete(id) {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `DELETE FROM lessons WHERE id = $1 RETURNING id`;
        const res = await query(sql, [id]);
        return res.rows.length > 0;
      } catch (err) {
        console.warn('LessonRepository delete fallback to mockStore:', err.message);
      }
    }

    const idx = mockData.dailyClasses.findIndex(c => c._id === id || c.id === id);
    if (idx !== -1) {
      mockData.dailyClasses.splice(idx, 1);
      return true;
    }
    return false;
  }

  normalizeLesson(l) {
    if (!l) return null;
    const id = l.id || l._id;
    const chapterId = l.chapter_id || l.chapterId || l.chapter;
    const rawDuration = l.duration !== undefined ? l.duration : 60;
    const parsedDuration = Number.parseInt(rawDuration, 10);
    return {
      id,
      _id: id,
      chapterId,
      chapter: chapterId,
      title: l.title,
      description: l.description || '',
      content: l.description || l.content || '',
      classNumber: l.class_number !== undefined ? Number(l.class_number) : (l.classNumber !== undefined ? Number(l.classNumber) : 1),
      classDate: l.class_date || l.classDate || new Date().toISOString(),
      duration: Number.isFinite(parsedDuration) ? parsedDuration : 60,
      order: l.order_index !== undefined ? Number(l.order_index) : (l.order !== undefined ? Number(l.order) : 0),
      order_index: l.order_index !== undefined ? Number(l.order_index) : (l.order !== undefined ? Number(l.order) : 0),
      isLive: l.is_live !== undefined ? Boolean(l.is_live) : (l.isLive !== undefined ? Boolean(l.isLive) : false),
      isFree: l.is_free !== undefined ? Boolean(l.is_free) : Boolean(l.isFree),
      isProtected: l.is_protected !== undefined ? Boolean(l.is_protected) : (l.isProtected !== undefined ? Boolean(l.isProtected) : true),
      videoUrl: l.video_url || l.videoUrl || '',
      videoProvider: l.video_provider || l.videoProvider || 'youtube',
      createdAt: l.created_at || l.createdAt,
      updatedAt: l.updated_at || l.updatedAt,
    };
  }
}

export const lessonRepository = new LessonRepository();
export default lessonRepository;
