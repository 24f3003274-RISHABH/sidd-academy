import { query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import { noteRepository } from './note.repository.js';
import ENV from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Course Repository - Data Access Layer for Courses
 */
export class CourseRepository {
  /**
   * Find paginated courses with optional filters (search, level, isPublished, excludeCourseIds)
   */
  async findAll({ search, level, isPublished = true, page = 1, limit = 10, isAdmin = false, excludeCourseIds = [] }) {
    const offset = (page - 1) * limit;
    const excludedSet = new Set((excludeCourseIds || []).filter(Boolean));

    let allCourses = [...mockData.courses];

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT id, title, slug, description, price, discount_price, thumbnail, duration, 
                 level, is_published, total_students, total_students as enrolled_students, rating, rating_count, instructor, language, is_free, order_num, created_at, updated_at
          FROM courses 
          ORDER BY created_at DESC
        `;
        const res = await query(sql);
        const dbCourses = res.rows.map(this.normalizeCourse);
        const seenSlugs = new Set(dbCourses.map(c => c.slug).filter(Boolean));
        const seenIds = new Set(dbCourses.map(c => c.id || c._id).filter(Boolean));
        const mockExtras = mockData.courses
          .map(this.normalizeCourse)
          .filter(c => !seenSlugs.has(c.slug) && !seenIds.has(c.id || c._id));
        allCourses = [...dbCourses, ...mockExtras];
      } catch (err) {
        console.warn('CourseRepository findAll fallback to mockStore:', err.message);
      }
    }

    let filtered = allCourses.map(c => (c.id && c.isPublished !== undefined ? c : this.normalizeCourse(c)));
    if (!isAdmin && isPublished !== undefined) {
      filtered = filtered.filter(c => c.isPublished === isPublished || c.is_published === isPublished);
    }
    if (excludedSet.size > 0) {
      filtered = filtered.filter(c => !excludedSet.has(c.id || c._id));
    }
    if (level) {
      filtered = filtered.filter(c => c.level === level);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c => (c.title && c.title.toLowerCase().includes(s)) || (c.description && c.description.toLowerCase().includes(s)));
    }

    const total = filtered.length;
    const courses = filtered.slice(offset, offset + limit);

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
          ? `SELECT *, total_students as enrolled_students FROM courses WHERE id = $1 LIMIT 1`
          : `SELECT *, total_students as enrolled_students FROM courses WHERE slug = $1 LIMIT 1`;

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

    if (ENV.DATABASE_URL && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)) {
      try {
        const subjectsRes = await query(
          `SELECT id, course_id, title, COALESCE(name, title) as name, order_num as order_index, created_at, updated_at 
           FROM subjects WHERE course_id = $1 ORDER BY order_num ASC, created_at ASC`,
          [courseId]
        );

        const subjects = subjectsRes.rows;
        const subjectIds = subjects.map((subject) => subject.id);

        const chaptersRes = subjectIds.length
          ? await query(
              `SELECT id, subject_id, title, order_num as order_index, created_at, updated_at
               FROM chapters WHERE subject_id = ANY($1::uuid[]) ORDER BY order_num ASC, created_at ASC`,
              [subjectIds]
            )
          : { rows: [] };
        const chapters = chaptersRes.rows;
        const chapterIds = chapters.map((chapter) => chapter.id);

        const lessonsRes = chapterIds.length
          ? await query(
              `SELECT id, chapter_id, title, description, class_date, class_number, duration, is_free, is_protected, order_num as order_index, false as is_live, created_at, updated_at
               FROM lessons WHERE chapter_id = ANY($1::uuid[]) ORDER BY order_num ASC, class_date ASC`,
              [chapterIds]
            )
          : { rows: [] };
        const lessons = lessonsRes.rows;
        const lessonIds = lessons.map((lesson) => lesson.id);

        const [videosRes, notesRes] = await Promise.all([
          lessonIds.length
            ? query(
                `SELECT id, lesson_id, title, video_url, video_provider, quality, false as is_free_preview
                 FROM videos WHERE lesson_id = ANY($1::uuid[])`,
                [lessonIds]
              )
            : Promise.resolve({ rows: [] }),
          query(
            `SELECT * FROM notes
             WHERE is_published = true
               AND (
                 course_id = $1
                 OR ($2::uuid[] IS NOT NULL AND subject_id = ANY($2::uuid[]))
                 OR ($3::uuid[] IS NOT NULL AND chapter_id = ANY($3::uuid[]))
                 OR ($4::uuid[] IS NOT NULL AND lesson_id = ANY($4::uuid[]))
               )
             ORDER BY created_at DESC`,
            [
              courseId,
              subjectIds.length ? subjectIds : null,
              chapterIds.length ? chapterIds : null,
              lessonIds.length ? lessonIds : null,
            ]
          ),
        ]);

        const normalizedNotes = notesRes.rows.map((n) => noteRepository.normalizeNote(n));

        const chaptersBySubject = new Map();
        const chapterById = new Map();
        chapters.forEach((chapter) => {
          chapter.lessons = [];
          chapterById.set(chapter.id, chapter);
          const subjectChapters = chaptersBySubject.get(chapter.subject_id) || [];
          subjectChapters.push(chapter);
          chaptersBySubject.set(chapter.subject_id, subjectChapters);
        });

        const videosByLesson = new Map(videosRes.rows.map((video) => [video.lesson_id, video]));
        const notesByLesson = new Map();
        const notesByChapter = new Map();
        const notesBySubject = new Map();

        normalizedNotes.forEach((note) => {
          if (note.lessonId) {
            const list = notesByLesson.get(note.lessonId) || [];
            list.push(note);
            notesByLesson.set(note.lessonId, list);
          }
          if (note.chapterId) {
            const list = notesByChapter.get(note.chapterId) || [];
            list.push(note);
            notesByChapter.set(note.chapterId, list);
          }
          if (note.subjectId) {
            const list = notesBySubject.get(note.subjectId) || [];
            list.push(note);
            notesBySubject.set(note.subjectId, list);
          }
        });

        lessons.forEach((lesson) => {
          lesson.video = videosByLesson.get(lesson.id) || null;
          lesson.videoUrl = lesson.video?.video_url || null;
          lesson.notes = notesByLesson.get(lesson.id) || [];
          const chapter = chapterById.get(lesson.chapter_id);
          if (chapter) chapter.lessons.push(lesson);
        });

        course.notes = normalizedNotes;
        course.subjects = subjects.map(s => ({
          ...s,
          _id: s.id,
          notes: notesBySubject.get(s.id) || [],
          chapters: (chaptersBySubject.get(s.id) || []).map(ch => {
            const normalizedLessons = (ch.lessons || []).map(l => ({
              ...l,
              _id: l.id,
              chapterId: l.chapter_id,
              classDate: l.class_date,
              classNumber: l.class_number,
              order: l.order_index,
              order_index: l.order_index,
              isFree: Boolean(l.is_free),
              isProtected: l.is_protected !== undefined ? Boolean(l.is_protected) : true,
              videoUrl: l.video_url || l.videoUrl || null,
              videoProvider: l.video_provider || l.videoProvider || 'youtube',
              notes: l.notes || [],
            }));
            return {
              ...ch,
              _id: ch.id,
              notes: notesByChapter.get(ch.id) || [],
              dailyClasses: normalizedLessons,
              lessons: normalizedLessons,
            };
          }),
        }));

        return course;
      } catch (err) {
        console.warn('CourseRepository findByIdWithHierarchy fallback to mockStore:', err.message);
      }
    }

    // In-memory fallback with full Video & Google Drive Study Material hierarchy attachment
    const c = { ...course };
    const allNormalizedNotes = (mockData.notes || [])
      .map(n => noteRepository.normalizeNote(n))
      .filter(n => n && n.isPublished !== false);

    const courseNotes = [];

    c.subjects = (mockData.subjects || [])
      .filter(s => s.course === courseId || s.courseId === courseId || s.course === course._id)
      .map(s => {
        const sId = s._id || s.id;
        const subjNotes = allNormalizedNotes.filter(n => n.subjectId === sId);
        const subj = { ...s, id: sId, _id: sId, name: s.name || s.title, title: s.title || s.name, notes: subjNotes };

        subj.chapters = (mockData.chapters || [])
          .filter(ch => ch.subject === sId || ch.subjectId === sId)
          .map(ch => {
            const chId = ch._id || ch.id;
            const chapNotes = allNormalizedNotes.filter(n => n.chapterId === chId);
            const chap = { ...ch, id: chId, _id: chId, subjectId: sId, notes: chapNotes };

            chap.dailyClasses = (mockData.dailyClasses || [])
              .filter(dc => dc.chapter === chId || dc.chapterId === chId)
              .map(dc => {
                const lId = dc._id || dc.id;
                const vid = (mockData.videos || []).find(v => v.lessonId === lId);
                const lessonNotes = allNormalizedNotes.filter(
                  n => n.lessonId === lId || (!n.lessonId && n.chapterId === chId)
                );
                return {
                  ...dc,
                  id: lId,
                  _id: lId,
                  chapterId: chId,
                  video: vid || null,
                  videoUrl: dc.videoUrl || vid?.videoUrl || null,
                  isFree: Boolean(dc.isFree ?? dc.is_free),
                  isProtected: dc.isProtected !== undefined ? Boolean(dc.isProtected) : !Boolean(dc.isFree ?? dc.is_free),
                  notes: lessonNotes,
                };
              });
            chap.lessons = chap.dailyClasses;
            return chap;
          });
        return subj;
      });

    const subjectIdSet = new Set(c.subjects.map(s => s.id));
    const chapterIdSet = new Set(c.subjects.flatMap(s => s.chapters.map(ch => ch.id)));
    const lessonIdSet = new Set(c.subjects.flatMap(s => s.chapters.flatMap(ch => ch.lessons.map(l => l.id))));

    allNormalizedNotes.forEach(n => {
      if (
        n.courseId === courseId ||
        (n.subjectId && subjectIdSet.has(n.subjectId)) ||
        (n.chapterId && chapterIdSet.has(n.chapterId)) ||
        (n.lessonId && lessonIdSet.has(n.lessonId))
      ) {
        courseNotes.push(n);
      }
    });

    c.notes = courseNotes;
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
      rating = 4.90,
      ratingCount = 0,
      instructor = 'Sidd Academy Faculty',
      language = 'Hinglish',
      isFree = false,
      orderNum = 0,
    } = courseData;

    const id = uuidv4();
    const safeRating = rating !== undefined && rating !== null ? Math.max(0, Math.min(5, Number(rating))) : 4.90;
    const safePrice = Math.max(0, Number(price) || 0);
    const safeDiscountPrice = Math.max(0, Number(discountPrice) || 0);
    const safeIsFree = isFree === true || isFree === 'true' || safePrice === 0;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          INSERT INTO courses (
            id, title, slug, description, price, discount_price, thumbnail, 
            duration, level, is_published, total_students,
            rating, instructor, language, is_free, order_num, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, $12, $13, $14, $15, NOW(), NOW())
          RETURNING *
        `;
        const res = await query(sql, [
          id,
          title.trim(),
          slug,
          (description || '').trim(),
          safePrice,
          safeDiscountPrice,
          thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600',
          duration || '60+ Hours',
          level || 'All Levels',
          Boolean(isPublished),
          safeRating,
          instructor || 'Sidd Academy Faculty',
          language || 'Hinglish',
          safeIsFree,
          Number(orderNum) || 0,
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
      description: (description || '').trim(),
      price: safePrice,
      discountPrice: safeDiscountPrice,
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600',
      duration,
      level,
      isPublished: Boolean(isPublished),
      enrolledStudents: 0,
      totalStudents: 0,
      rating: safeRating,
      ratingCount: Number(ratingCount) || 0,
      instructor: instructor || 'Sidd Academy Faculty',
      language: language || 'Hinglish',
      isFree: safeIsFree,
      orderNum: Number(orderNum) || 0,
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
          values.push(Math.max(0, Number(updates.price) || 0));
        }
        if (updates.discountPrice !== undefined) {
          fields.push(`discount_price = $${pIndex++}`);
          values.push(Math.max(0, Number(updates.discountPrice) || 0));
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
          values.push(updates.isPublished === true || updates.isPublished === 'true');
        }
        if (updates.rating !== undefined) {
          fields.push(`rating = $${pIndex++}`);
          values.push(Math.max(0, Math.min(5, Number(updates.rating))));
        }
        if (updates.instructor !== undefined) {
          fields.push(`instructor = $${pIndex++}`);
          values.push(updates.instructor);
        }
        if (updates.language !== undefined) {
          fields.push(`language = $${pIndex++}`);
          values.push(updates.language);
        }
        if (updates.isFree !== undefined) {
          fields.push(`is_free = $${pIndex++}`);
          values.push(updates.isFree === true || updates.isFree === 'true');
        }
        if (updates.orderNum !== undefined || updates.order !== undefined) {
          fields.push(`order_num = $${pIndex++}`);
          values.push(Number(updates.orderNum ?? updates.order));
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
    if (updates.price !== undefined) course.price = Math.max(0, Number(updates.price));
    if (updates.discountPrice !== undefined) course.discountPrice = Math.max(0, Number(updates.discountPrice));
    if (updates.thumbnail !== undefined) course.thumbnail = updates.thumbnail;
    if (updates.duration !== undefined) course.duration = updates.duration;
    if (updates.level !== undefined) course.level = updates.level;
    if (updates.isPublished !== undefined) course.isPublished = updates.isPublished === true || updates.isPublished === 'true';
    if (updates.rating !== undefined) course.rating = Math.max(0, Math.min(5, Number(updates.rating)));
    if (updates.instructor !== undefined) course.instructor = updates.instructor;
    if (updates.language !== undefined) course.language = updates.language;
    if (updates.isFree !== undefined) course.isFree = updates.isFree === true || updates.isFree === 'true';
    if (updates.orderNum !== undefined) course.orderNum = Number(updates.orderNum);
    course.updatedAt = new Date().toISOString();

    return this.normalizeCourse(course);
  }

  /**
   * Count total courses with optional published filter
   */
  async count({ isPublished } = {}) {
    if (ENV.DATABASE_URL) {
      try {
        let sql = `SELECT COUNT(*) FROM courses`;
        const params = [];
        if (isPublished !== undefined) {
          sql += ` WHERE is_published = $1`;
          params.push(isPublished);
        }
        const res = await query(sql, params);
        return parseInt(res.rows[0]?.count || 0, 10);
      } catch (err) {
        console.warn('CourseRepository count fallback to mockStore:', err.message);
      }
    }

    let list = [...(mockData.courses || [])];
    if (isPublished !== undefined) {
      list = list.filter(c => (c.isPublished ?? true) === isPublished);
    }
    return list.length;
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
      duration: c.duration || '60+ Hours',
      level: c.level || 'All Levels',
      isPublished: c.is_published !== undefined ? Boolean(c.is_published) : (c.isPublished !== undefined ? Boolean(c.isPublished) : true),
      enrolledStudents: c.total_students !== undefined ? Number(c.total_students) : (c.enrolled_students !== undefined ? Number(c.enrolled_students) : (c.enrolledStudents !== undefined ? Number(c.enrolledStudents) : 0)),
      totalStudents: c.total_students !== undefined ? Number(c.total_students) : (c.enrolled_students !== undefined ? Number(c.enrolled_students) : (c.totalStudents !== undefined ? Number(c.totalStudents) : 0)),
      rating: c.rating !== undefined && c.rating !== null ? Number(c.rating) : 4.90,
      ratingCount: c.rating_count !== undefined ? Number(c.rating_count) : (c.ratingCount !== undefined ? Number(c.ratingCount) : 0),
      instructor: c.instructor || 'Sidd Academy Faculty',
      language: c.language || 'Hinglish',
      isFree: c.is_free !== undefined ? Boolean(c.is_free) : (c.isFree !== undefined ? Boolean(c.isFree) : false),
      orderNum: c.order_num !== undefined ? Number(c.order_num) : (c.orderNum !== undefined ? Number(c.orderNum) : 0),
      createdAt: c.created_at || c.createdAt,
      updatedAt: c.updated_at || c.updatedAt,
      subjects: c.subjects || [],
      notes: c.notes || [],
    };
  }
}

export const courseRepository = new CourseRepository();
export default courseRepository;
