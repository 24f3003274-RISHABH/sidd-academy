import { query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Course Repository - Data Access Layer for Courses
 */
export class CourseRepository {
  /**
   * Find paginated courses with optional filters (search, level, isPublished)
   */
  async findAll({ search, level, isPublished = true, page = 1, limit = 10, isAdmin = false }) {
    const offset = (page - 1) * limit;

    if (ENV.DATABASE_URL) {
      try {
        const conditions = [];
        const params = [];
        let pIndex = 1;

        if (!isAdmin && isPublished !== undefined) {
          conditions.push(`is_published = $${pIndex++}`);
          params.push(isPublished);
        }

        if (level) {
          conditions.push(`level = $${pIndex++}`);
          params.push(level);
        }

        if (search) {
          conditions.push(`(title ILIKE $${pIndex} OR description ILIKE $${pIndex})`);
          params.push(`%${search.trim()}%`);
          pIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Count total
        const countSql = `SELECT COUNT(*) FROM courses ${whereClause}`;
        const countRes = await query(countSql, params);
        const total = parseInt(countRes.rows[0].count, 10);

        // Fetch courses
        const sql = `
          SELECT id, title, slug, description, price, discount_price, thumbnail, duration, 
                 level, is_published, enrolled_students, rating, rating_count, created_at, updated_at
          FROM courses 
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT $${pIndex++} OFFSET $${pIndex++}
        `;
        const fetchParams = [...params, limit, offset];
        const res = await query(sql, fetchParams);

        const courses = res.rows.map(this.normalizeCourse);

        return {
          courses,
          total,
          page,
          pages: Math.ceil(total / limit) || 1,
        };
      } catch (err) {
        console.warn('CourseRepository findAll fallback to mockStore:', err.message);
      }
    }

    // In-memory fallback
    let filtered = [...mockData.courses];
    if (!isAdmin && isPublished !== undefined) {
      filtered = filtered.filter(c => c.isPublished === isPublished || c.is_published === isPublished);
    }
    if (level) {
      filtered = filtered.filter(c => c.level === level);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c => (c.title && c.title.toLowerCase().includes(s)) || (c.description && c.description.toLowerCase().includes(s)));
    }

    const total = filtered.length;
    const courses = filtered.slice(offset, offset + limit).map(this.normalizeCourse);

    return {
      courses,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Find course by ID or Slug
   */
  async findById(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL) {
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        const sql = isUUID 
          ? `SELECT * FROM courses WHERE id = $1 LIMIT 1`
          : `SELECT * FROM courses WHERE id = $1 OR slug = $1 LIMIT 1`;

        const res = await query(sql, [id]);
        if (res.rows.length > 0) {
          return this.normalizeCourse(res.rows[0]);
        }
      } catch (err) {
        console.warn('CourseRepository findById fallback to mockStore:', err.message);
      }
    }

    const raw = mockData.courses.find(c => c._id === id || c.id === id || c.slug === id);
    return raw ? this.normalizeCourse(raw) : null;
  }

  /**
   * Find course with full hierarchy: Subjects -> Chapters -> Lessons (and attached Videos/Notes)
   */
  async findByIdWithHierarchy(id) {
    const course = await this.findById(id);
    if (!course) return null;

    const courseId = course.id;

    if (ENV.DATABASE_URL) {
      try {
        // Fetch subjects
        const subjectsRes = await query(
          `SELECT id, course_id, name, order_index, created_at, updated_at 
           FROM subjects WHERE course_id = $1 ORDER BY order_index ASC, created_at ASC`,
          [courseId]
        );

        const subjects = subjectsRes.rows;

        for (const subj of subjects) {
          const chaptersRes = await query(
            `SELECT id, subject_id, title, order_index, created_at, updated_at 
             FROM chapters WHERE subject_id = $1 ORDER BY order_index ASC, created_at ASC`,
            [subj.id]
          );

          subj.chapters = chaptersRes.rows;

          for (const chap of subj.chapters) {
            const lessonsRes = await query(
              `SELECT id, chapter_id, title, class_date, duration, order_index, is_live, created_at, updated_at 
               FROM lessons WHERE chapter_id = $1 ORDER BY order_index ASC, class_date ASC`,
              [chap.id]
            );

            chap.lessons = lessonsRes.rows;
            chap.dailyClasses = lessonsRes.rows; // Compatibility alias

            for (const lesson of chap.lessons) {
              // Fetch attached video
              const videoRes = await query(
                `SELECT id, lesson_id, title, youtube_url, provider, resolution, is_free_preview 
                 FROM videos WHERE lesson_id = $1 LIMIT 1`,
                [lesson.id]
              );
              lesson.video = videoRes.rows.length > 0 ? videoRes.rows[0] : null;

              // Fetch attached notes
              const notesRes = await query(
                `SELECT id, title, file_url, is_free, price FROM notes WHERE lesson_id = $1`,
                [lesson.id]
              );
              lesson.notes = notesRes.rows;
            }
          }
        }

        course.subjects = subjects.map(s => ({
          ...s,
          _id: s.id,
          chapters: (s.chapters || []).map(ch => ({
            ...ch,
            _id: ch.id,
            dailyClasses: (ch.lessons || []).map(l => ({
              ...l,
              _id: l.id,
            })),
            lessons: (ch.lessons || []).map(l => ({
              ...l,
              _id: l.id,
            }))
          }))
        }));

        return course;
      } catch (err) {
        console.warn('CourseRepository findByIdWithHierarchy fallback to mockStore:', err.message);
      }
    }

    // In-memory fallback
    const c = { ...course };
    c.subjects = mockData.subjects
      .filter(s => s.course === courseId || s.courseId === courseId || s.course === course._id)
      .map(s => {
        const subj = { ...s, id: s._id || s.id, _id: s._id || s.id };
        subj.chapters = mockData.chapters
          .filter(ch => ch.subject === s._id || ch.subject === s.id || ch.subjectId === s.id)
          .map(ch => {
            const chap = { ...ch, id: ch._id || ch.id, _id: ch._id || ch.id };
            chap.dailyClasses = mockData.dailyClasses
              .filter(dc => dc.chapter === ch._id || dc.chapter === ch.id || dc.chapterId === ch.id)
              .map(dc => ({ ...dc, id: dc._id || dc.id, _id: dc._id || dc.id }));
            chap.lessons = chap.dailyClasses;
            return chap;
          });
        return subj;
      });

    return c;
  }

  /**
   * Create a new Course
   */
  async create(courseData) {
    const {
      title,
      slug,
      description,
      price = 0,
      discountPrice = 0,
      thumbnail = '',
      duration = '6 Months',
      level = 'Class 10',
      isPublished = true,
    } = courseData;

    const id = uuidv4();

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          INSERT INTO courses (id, title, slug, description, price, discount_price, thumbnail, duration, level, is_published, enrolled_students, rating, rating_count, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 5.0, 0, NOW(), NOW())
          RETURNING *
        `;
        const res = await query(sql, [
          id,
          title.trim(),
          slug,
          description.trim(),
          price,
          discountPrice,
          thumbnail,
          duration,
          level,
          isPublished,
        ]);
        return this.normalizeCourse(res.rows[0]);
      } catch (err) {
        console.warn('CourseRepository create fallback to mockStore:', err.message);
      }
    }

    const memoryId = `course_${Date.now()}`;
    const newCourse = {
      _id: memoryId,
      id: memoryId,
      title: title.trim(),
      slug,
      description: description.trim(),
      price: Number(price),
      discountPrice: Number(discountPrice),
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600',
      duration,
      level,
      isPublished: Boolean(isPublished),
      enrolledStudents: 0,
      rating: 5.0,
      ratingCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockData.courses.unshift(newCourse);
    return this.normalizeCourse(newCourse);
  }

  /**
   * Update an existing Course
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
        if (updates.slug !== undefined) {
          fields.push(`slug = $${pIndex++}`);
          values.push(updates.slug);
        }
        if (updates.description !== undefined) {
          fields.push(`description = $${pIndex++}`);
          values.push(updates.description.trim());
        }
        if (updates.price !== undefined) {
          fields.push(`price = $${pIndex++}`);
          values.push(updates.price);
        }
        if (updates.discountPrice !== undefined) {
          fields.push(`discount_price = $${pIndex++}`);
          values.push(updates.discountPrice);
        }
        if (updates.thumbnail !== undefined) {
          fields.push(`thumbnail = $${pIndex++}`);
          values.push(updates.thumbnail);
        }
        if (updates.duration !== undefined) {
          fields.push(`duration = $${pIndex++}`);
          values.push(updates.duration);
        }
        if (updates.level !== undefined) {
          fields.push(`level = $${pIndex++}`);
          values.push(updates.level);
        }
        if (updates.isPublished !== undefined) {
          fields.push(`is_published = $${pIndex++}`);
          values.push(updates.isPublished);
        }
        fields.push(`updated_at = NOW()`);

        const sql = `
          UPDATE courses 
          SET ${fields.join(', ')} 
          WHERE id = $1 
          RETURNING *
        `;
        const res = await query(sql, values);
        if (res.rows.length > 0) {
          return this.normalizeCourse(res.rows[0]);
        }
      } catch (err) {
        console.warn('CourseRepository update fallback to mockStore:', err.message);
      }
    }

    const course = mockData.courses.find(c => c._id === id || c.id === id);
    if (!course) return null;

    if (updates.title !== undefined) course.title = updates.title.trim();
    if (updates.slug !== undefined) course.slug = updates.slug;
    if (updates.description !== undefined) course.description = updates.description.trim();
    if (updates.price !== undefined) course.price = Number(updates.price);
    if (updates.discountPrice !== undefined) course.discountPrice = Number(updates.discountPrice);
    if (updates.thumbnail !== undefined) course.thumbnail = updates.thumbnail;
    if (updates.duration !== undefined) course.duration = updates.duration;
    if (updates.level !== undefined) course.level = updates.level;
    if (updates.isPublished !== undefined) course.isPublished = Boolean(updates.isPublished);
    course.updatedAt = new Date().toISOString();

    return this.normalizeCourse(course);
  }

  /**
   * Delete a Course
   */
  async delete(id) {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `DELETE FROM courses WHERE id = $1 RETURNING id`;
        const res = await query(sql, [id]);
        return res.rows.length > 0;
      } catch (err) {
        console.warn('CourseRepository delete fallback to mockStore:', err.message);
      }
    }

    const idx = mockData.courses.findIndex(c => c._id === id || c.id === id);
    if (idx !== -1) {
      mockData.courses.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Helper to normalize database snake_case and memory camelCase into standard API format
   */
  normalizeCourse(c) {
    if (!c) return null;
    const id = c.id || c._id;
    return {
      id,
      _id: id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      price: c.price !== undefined ? Number(c.price) : 0,
      discountPrice: c.discount_price !== undefined ? Number(c.discount_price) : (c.discountPrice !== undefined ? Number(c.discountPrice) : 0),
      thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600',
      duration: c.duration || '6 Months',
      level: c.level || 'Class 10',
      isPublished: c.is_published !== undefined ? Boolean(c.is_published) : (c.isPublished !== undefined ? Boolean(c.isPublished) : true),
      enrolledStudents: c.enrolled_students !== undefined ? Number(c.enrolled_students) : (c.enrolledStudents !== undefined ? Number(c.enrolledStudents) : 0),
      rating: c.rating !== undefined ? Number(c.rating) : 5.0,
      ratingCount: c.rating_count !== undefined ? Number(c.rating_count) : (c.ratingCount !== undefined ? Number(c.ratingCount) : 0),
      createdAt: c.created_at || c.createdAt,
      updatedAt: c.updated_at || c.updatedAt,
      subjects: c.subjects || [],
    };
  }
}

export const courseRepository = new CourseRepository();
export default courseRepository;
