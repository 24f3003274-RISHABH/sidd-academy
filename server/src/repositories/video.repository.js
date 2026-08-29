import { query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Video Repository - PostgreSQL Data Access Layer with MockStore Resilient Fallback
 */
export class VideoRepository {
  normalizeVideo(row) {
    if (!row) return null;
    return {
      id: row.id || row._id,
      _id: row.id || row._id,
      lessonId: row.lesson_id || row.lessonId,
      title: row.title,
      videoUrl: row.video_url || row.videoUrl || row.youtube_url || '',
      youtubeId: row.youtube_id || row.youtubeId || '',
      playlistUrl: row.playlist_url || row.playlistUrl || '',
      thumbnailUrl: row.thumbnail_url || row.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      durationSeconds: Number(row.duration_seconds ?? row.durationSeconds ?? 0),
      videoProvider: row.video_provider || row.videoProvider || 'youtube',
      quality: row.quality || '1080p',
      order: Number(row.order_num ?? row.order ?? 0),
      lessonTitle: row.lesson_title || '',
      courseTitle: row.course_title || '',
      subjectTitle: row.subject_title || '',
      createdAt: row.created_at || row.createdAt || new Date(),
      updatedAt: row.updated_at || row.updatedAt || new Date(),
    };
  }

  /**
   * Find all videos with optional filtering
   */
  async findAll({ lessonId, courseId, provider, search, limit = 50, page = 1 } = {}) {
    const offset = (Number(page) - 1) * Number(limit);

    if (ENV.DATABASE_URL) {
      try {
        let sql = `
          SELECT v.id, v.lesson_id, v.title, v.video_url, v.youtube_id, v.playlist_url,
                 v.thumbnail_url, v.duration_seconds, v.video_provider, v.quality, v.order_num,
                 v.created_at, v.updated_at,
                 l.title as lesson_title,
                 c.title as course_title,
                 s.name as subject_title
          FROM videos v
          LEFT JOIN lessons l ON v.lesson_id = l.id
          LEFT JOIN chapters ch ON l.chapter_id = ch.id
          LEFT JOIN subjects s ON ch.subject_id = s.id
          LEFT JOIN courses c ON s.course_id = c.id
          WHERE 1=1
        `;
        const params = [];
        let pIndex = 1;

        if (lessonId) {
          sql += ` AND v.lesson_id = $${pIndex++}`;
          params.push(lessonId);
        }

        if (courseId) {
          sql += ` AND c.id = $${pIndex++}`;
          params.push(courseId);
        }

        if (provider) {
          sql += ` AND v.video_provider = $${pIndex++}`;
          params.push(provider);
        }

        if (search) {
          sql += ` AND (v.title ILIKE $${pIndex} OR l.title ILIKE $${pIndex})`;
          params.push(`%${search}%`);
          pIndex++;
        }

        sql += ` ORDER BY v.order_num ASC, v.created_at DESC LIMIT $${pIndex++} OFFSET $${pIndex++}`;
        params.push(Number(limit), offset);

        const res = await query(sql, params);
        return res.rows.map(this.normalizeVideo);
      } catch (err) {
        console.warn('VideoRepository findAll fallback to mockStore:', err.message);
      }
    }

    // In-memory fallback
    let filtered = [...(mockData.videos || [])];

    if (lessonId) {
      filtered = filtered.filter(v => v.lessonId === lessonId);
    }
    if (provider) {
      filtered = filtered.filter(v => v.videoProvider === provider);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(v => v.title && v.title.toLowerCase().includes(q));
    }

    return filtered.slice(offset, offset + Number(limit)).map(this.normalizeVideo);
  }

  /**
   * Find video by ID
   */
  async findById(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT v.id, v.lesson_id, v.title, v.video_url, v.youtube_id, v.playlist_url,
                 v.thumbnail_url, v.duration_seconds, v.video_provider, v.quality, v.order_num,
                 v.created_at, v.updated_at,
                 l.title as lesson_title,
                 c.title as course_title,
                 s.name as subject_title
          FROM videos v
          LEFT JOIN lessons l ON v.lesson_id = l.id
          LEFT JOIN chapters ch ON l.chapter_id = ch.id
          LEFT JOIN subjects s ON ch.subject_id = s.id
          LEFT JOIN courses c ON s.course_id = c.id
          WHERE v.id = $1
          LIMIT 1
        `;
        const res = await query(sql, [id]);
        if (res.rows.length > 0) {
          return this.normalizeVideo(res.rows[0]);
        }
      } catch (err) {
        console.warn('VideoRepository findById fallback to mockStore:', err.message);
      }
    }

    const vid = (mockData.videos || []).find(v => v._id === id || v.id === id);
    return vid ? this.normalizeVideo(vid) : null;
  }

  /**
   * Find video associated with a lesson
   */
  async findByLessonId(lessonId) {
    if (!lessonId) return [];

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT v.id, v.lesson_id, v.title, v.video_url, v.youtube_id, v.playlist_url,
                 v.thumbnail_url, v.duration_seconds, v.video_provider, v.quality, v.order_num,
                 v.created_at, v.updated_at,
                 l.title as lesson_title
          FROM videos v
          LEFT JOIN lessons l ON v.lesson_id = l.id
          WHERE v.lesson_id = $1
          ORDER BY v.order_num ASC
        `;
        const res = await query(sql, [lessonId]);
        return res.rows.map(this.normalizeVideo);
      } catch (err) {
        console.warn('VideoRepository findByLessonId fallback to mockStore:', err.message);
      }
    }

    return (mockData.videos || [])
      .filter(v => v.lessonId === lessonId)
      .map(this.normalizeVideo);
  }

  /**
   * Create video entry
   */
  async create(data) {
    const id = uuidv4();

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          INSERT INTO videos (
            id, lesson_id, title, video_url, youtube_id, playlist_url,
            thumbnail_url, duration_seconds, video_provider, quality, order_num
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `;
        const params = [
          id,
          data.lessonId,
          data.title,
          data.videoUrl,
          data.youtubeId || null,
          data.playlistUrl || null,
          data.thumbnailUrl || null,
          Number(data.durationSeconds || 0),
          data.videoProvider || 'youtube',
          data.quality || '1080p',
          Number(data.order || 0),
        ];

        const res = await query(sql, params);
        return this.normalizeVideo(res.rows[0]);
      } catch (err) {
        console.warn('VideoRepository create fallback to mockStore:', err.message);
      }
    }

    const mockVid = {
      _id: id,
      id,
      lessonId: data.lessonId,
      title: data.title,
      videoUrl: data.videoUrl,
      youtubeId: data.youtubeId || '',
      playlistUrl: data.playlistUrl || '',
      thumbnailUrl: data.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      durationSeconds: Number(data.durationSeconds || 0),
      videoProvider: data.videoProvider || 'youtube',
      quality: data.quality || '1080p',
      order: Number(data.order || 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!mockData.videos) mockData.videos = [];
    mockData.videos.push(mockVid);
    return this.normalizeVideo(mockVid);
  }

  /**
   * Update video entry
   */
  async update(id, data) {
    if (!id) return null;

    if (ENV.DATABASE_URL) {
      try {
        const fields = [];
        const params = [];
        let pIndex = 1;

        if (data.lessonId !== undefined) { fields.push(`lesson_id = $${pIndex++}`); params.push(data.lessonId); }
        if (data.title !== undefined) { fields.push(`title = $${pIndex++}`); params.push(data.title); }
        if (data.videoUrl !== undefined) { fields.push(`video_url = $${pIndex++}`); params.push(data.videoUrl); }
        if (data.youtubeId !== undefined) { fields.push(`youtube_id = $${pIndex++}`); params.push(data.youtubeId); }
        if (data.playlistUrl !== undefined) { fields.push(`playlist_url = $${pIndex++}`); params.push(data.playlistUrl); }
        if (data.thumbnailUrl !== undefined) { fields.push(`thumbnail_url = $${pIndex++}`); params.push(data.thumbnailUrl); }
        if (data.durationSeconds !== undefined) { fields.push(`duration_seconds = $${pIndex++}`); params.push(Number(data.durationSeconds)); }
        if (data.videoProvider !== undefined) { fields.push(`video_provider = $${pIndex++}`); params.push(data.videoProvider); }
        if (data.quality !== undefined) { fields.push(`quality = $${pIndex++}`); params.push(data.quality); }
        if (data.order !== undefined) { fields.push(`order_num = $${pIndex++}`); params.push(Number(data.order)); }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        if (fields.length === 1) {
          return this.findById(id);
        }

        params.push(id);
        const sql = `UPDATE videos SET ${fields.join(', ')} WHERE id = $${pIndex} RETURNING *`;
        const res = await query(sql, params);
        if (res.rows.length > 0) {
          return this.normalizeVideo(res.rows[0]);
        }
      } catch (err) {
        console.warn('VideoRepository update fallback to mockStore:', err.message);
      }
    }

    const idx = (mockData.videos || []).findIndex(v => v._id === id || v.id === id);
    if (idx === -1) return null;

    mockData.videos[idx] = {
      ...mockData.videos[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.normalizeVideo(mockData.videos[idx]);
  }

  /**
   * Delete video entry
   */
  async delete(id) {
    if (!id) return false;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `DELETE FROM videos WHERE id = $1 RETURNING id`;
        const res = await query(sql, [id]);
        return res.rowCount > 0;
      } catch (err) {
        console.warn('VideoRepository delete fallback to mockStore:', err.message);
      }
    }

    const idx = (mockData.videos || []).findIndex(v => v._id === id || v.id === id);
    if (idx === -1) return false;
    mockData.videos.splice(idx, 1);
    return true;
  }
}

export const videoRepository = new VideoRepository();
