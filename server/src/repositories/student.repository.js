import { query, getPool } from '../config/db.js';
import ENV from '../config/env.js';
import { mockData } from '../data/mockStore.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Student Repository
 * Handles database operations for student dashboard, enrollments, course progress, and activities
 */
export class StudentRepository {
  /**
   * Get student's enrolled courses with progress
   */
  async getEnrolledCourses(userId) {
    if (!userId) return [];

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT 
            c.id, c.title, c.description, c.instructor, c.thumbnail, 
            c.price, c.discount_price, c.is_free, c.level, 'Academic' as category,
            e.enrolled_at, e.status as enrollment_status, e.progress_percentage,
            (SELECT COUNT(*) FROM subjects s WHERE s.course_id = c.id) as total_subjects,
            (SELECT COUNT(*) FROM lessons l 
             JOIN chapters ch ON l.chapter_id = ch.id 
             JOIN subjects su ON ch.subject_id = su.id 
             WHERE su.course_id = c.id) as total_lessons,
            (SELECT COUNT(*) FROM lesson_progress lp 
             WHERE lp.user_id = $1 AND lp.course_id = c.id AND lp.is_completed = true) as completed_lessons
          FROM enrollments e
          JOIN courses c ON e.course_id = c.id
          WHERE e.user_id = $1 AND e.status = 'active'
          ORDER BY e.enrolled_at DESC
        `;
        const res = await query(sql, [userId]);
        return res.rows.map(row => ({
          id: row.id,
          _id: row.id,
          title: row.title,
          description: row.description,
          instructor: row.instructor,
          thumbnail: row.thumbnail,
          level: row.level,
          category: row.category,
          enrolledAt: row.enrolled_at,
          enrollmentStatus: row.enrollment_status,
          progressPercentage: Number(row.progress_percentage || 0),
          totalSubjects: parseInt(row.total_subjects || 0, 10),
          totalLessons: parseInt(row.total_lessons || 0, 10),
          completedLessons: parseInt(row.completed_lessons || 0, 10),
        }));
      } catch (err) {
        console.warn('StudentRepository getEnrolledCourses DB fallback:', err.message);
      }
    }

    // Mock fallback
    const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
    const purchasedIds = user?.purchasedCourses || [];
    const enrollments = mockData.enrollments || [];

    const enrolledCourses = [];
    for (const courseId of purchasedIds) {
      const course = (mockData.courses || []).find(c => c._id === courseId || c.id === courseId);
      if (course) {
        const enr = enrollments.find(e => (e.userId === userId) && (e.courseId === courseId));
        const userProgress = (mockData.lessonProgress || []).filter(lp => lp.userId === userId && lp.courseId === courseId && lp.isCompleted);
        
        // Count total lessons in this course from mock data
        const courseSubjs = (mockData.subjects || []).filter(s => s.courseId === courseId || (course.subjects || []).includes(s._id || s.id));
        const subjIds = courseSubjs.map(s => s._id || s.id);
        const courseChaps = (mockData.chapters || []).filter(ch => subjIds.includes(ch.subjectId));
        const chapIds = courseChaps.map(ch => ch._id || ch.id);
        const courseLessons = (mockData.lessons || []).filter(l => chapIds.includes(l.chapterId));
        
        const totalLessonsCount = courseLessons.length || course.totalLessons || 12;
        const completedCount = userProgress.length;
        const progressPct = enr?.progressPercentage !== undefined 
          ? enr.progressPercentage 
          : (totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0);

        enrolledCourses.push({
          id: course._id || course.id,
          _id: course._id || course.id,
          title: course.title,
          description: course.description,
          instructor: course.instructor,
          thumbnail: course.thumbnail,
          level: course.level,
          category: course.category,
          enrolledAt: enr?.enrolledAt || new Date(),
          enrollmentStatus: enr?.status || 'active',
          progressPercentage: progressPct,
          totalSubjects: courseSubjs.length || 1,
          totalLessons: totalLessonsCount,
          completedLessons: completedCount,
        });
      }
    }

    return enrolledCourses;
  }

  /**
   * Get student's purchased notes with file access
   */
  async getPurchasedNotes(userId) {
    if (!userId) return [];

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT 
            n.id, n.title, n.description, n.file_url, n.file_size, n.is_free, n.price,
            np.purchased_at, np.price_paid,
            COALESCE(s.title, 'Academic Material') as subject_name,
            c.title as course_title, c.id as course_id
          FROM note_purchases np
          JOIN notes n ON np.note_id = n.id
          LEFT JOIN subjects s ON n.subject_id = s.id
          LEFT JOIN courses c ON n.course_id = c.id
          WHERE np.user_id = $1
          ORDER BY np.purchased_at DESC
        `;
        const res = await query(sql, [userId]);
        return res.rows.map(row => ({
          id: row.id,
          _id: row.id,
          title: row.title,
          description: row.description,
          fileUrl: row.file_url,
          fileSize: row.file_size || '2.4 MB',
          isFree: row.is_free,
          price: Number(row.price || 0),
          pricePaid: Number(row.price_paid || 0),
          purchasedAt: row.purchased_at,
          subjectName: row.subject_name || 'Study Material',
          courseTitle: row.course_title,
          courseId: row.course_id,
        }));
      } catch (err) {
        console.warn('StudentRepository getPurchasedNotes DB fallback:', err.message);
      }
    }

    // Mock fallback
    const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
    const purchasedNoteIds = user?.purchasedNotes || [];
    const notePurchases = mockData.notePurchases || [];

    const notes = [];
    for (const noteId of purchasedNoteIds) {
      const note = (mockData.notes || []).find(n => n._id === noteId || n.id === noteId);
      if (note) {
        const np = notePurchases.find(p => p.userId === userId && (p.noteId === noteId));
        const course = (mockData.courses || []).find(c => c._id === note.courseId || c.id === note.courseId);
        const subject = (mockData.subjects || []).find(s => s._id === note.subjectId || s.id === note.subjectId);

        notes.push({
          id: note._id || note.id,
          _id: note._id || note.id,
          title: note.title,
          description: note.description,
          fileUrl: note.fileUrl,
          fileSize: note.fileSize || '3.2 MB',
          isFree: note.isFree || false,
          price: note.price || 0,
          pricePaid: np?.pricePaid || note.price || 0,
          purchasedAt: np?.purchasedAt || new Date(),
          subjectName: subject?.name || 'Science & Grammar',
          courseTitle: course?.title || 'Academic Course Material',
          courseId: note.courseId,
        });
      }
    }

    return notes;
  }

  /**
   * Get recent daily classes from enrolled courses
   */
  async getRecentClasses(userId) {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT 
            l.id, l.title, l.description, l.order_num as order_index, l.created_at,
            ch.title as chapter_title,
            s.title as subject_name,
            c.id as course_id, c.title as course_title,
            v.id as video_id, v.duration_seconds, v.thumbnail_url,
            COALESCE(lp.is_completed, false) as is_completed
          FROM lessons l
          JOIN chapters ch ON l.chapter_id = ch.id
          JOIN subjects s ON ch.subject_id = s.id
          JOIN courses c ON s.course_id = c.id
          JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
          LEFT JOIN videos v ON v.lesson_id = l.id
          LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = $1
          ORDER BY l.created_at DESC
          LIMIT 6
        `;
        const res = await query(sql, [userId]);
        return res.rows.map(r => ({
          id: r.id,
          _id: r.id,
          title: r.title,
          description: r.description,
          chapterTitle: r.chapter_title,
          subjectName: r.subject_name,
          courseId: r.course_id,
          courseTitle: r.course_title,
          videoId: r.video_id,
          duration: r.duration_seconds ? `${Math.round(r.duration_seconds / 60)} mins` : '45 mins',
          thumbnail: r.thumbnail_url || 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600',
          isCompleted: !!r.is_completed,
          createdAt: r.created_at,
        }));
      } catch (err) {
        console.warn('StudentRepository getRecentClasses DB fallback:', err.message);
      }
    }

    // Mock fallback
    const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
    const purchasedIds = user?.purchasedCourses || [];
    const recentLessons = [];

    for (const courseId of purchasedIds) {
      const course = (mockData.courses || []).find(c => c._id === courseId || c.id === courseId);
      if (!course) continue;

      const subjs = (mockData.subjects || []).filter(s => s.courseId === courseId);
      for (const subj of subjs) {
        const chaps = (mockData.chapters || []).filter(ch => ch.subjectId === (subj._id || subj.id));
        for (const chap of chaps) {
          const lessons = (mockData.lessons || []).filter(l => l.chapterId === (chap._id || chap.id));
          for (const les of lessons) {
            const vid = (mockData.videos || []).find(v => v.lessonId === (les._id || les.id));
            const isComp = (mockData.lessonProgress || []).some(lp => lp.userId === userId && lp.lessonId === (les._id || les.id) && lp.isCompleted);
            
            recentLessons.push({
              id: les._id || les.id,
              _id: les._id || les.id,
              title: les.title,
              description: les.description,
              chapterTitle: chap.title,
              subjectName: subj.name,
              courseId: course._id || course.id,
              courseTitle: course.title,
              videoId: vid?._id || vid?.id,
              duration: vid?.durationSeconds ? `${Math.round(vid.durationSeconds / 60)} mins` : '45 mins',
              thumbnail: vid?.thumbnailUrl || course.thumbnail,
              isCompleted: isComp,
              createdAt: les.createdAt || new Date(),
            });
          }
        }
      }
    }

    return recentLessons.slice(0, 6);
  }

  /**
   * Get available catalog courses (not yet enrolled)
   */
  async getAvailableCourses(userId, limit = 4) {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT c.*, 
            (SELECT COUNT(*) FROM subjects s WHERE s.course_id = c.id) as total_subjects
          FROM courses c
          WHERE c.is_published = true 
            AND c.id NOT IN (SELECT course_id FROM enrollments WHERE user_id = $1 AND status = 'active')
          ORDER BY c.rating DESC, c.total_students DESC
          LIMIT $2
        `;
        const res = await query(sql, [userId, limit]);
        return res.rows.map(r => ({
          id: r.id,
          _id: r.id,
          title: r.title,
          description: r.description,
          instructor: r.instructor,
          thumbnail: r.thumbnail,
          price: Number(r.price),
          discountPrice: r.discount_price !== null ? Number(r.discount_price) : null,
          isFree: r.is_free,
          level: r.level,
          category: 'Academic',
          rating: Number(r.rating || 5.0),
          ratingCount: 120,
          enrolledCount: Number(r.total_students || 0),
        }));
      } catch (err) {
        console.warn('StudentRepository getAvailableCourses DB fallback:', err.message);
      }
    }

    // Mock fallback
    const user = (mockData.users || []).find(u => u._id === userId || u.id === userId);
    const purchasedIds = user?.purchasedCourses || [];

    return (mockData.courses || [])
      .filter(c => c.isPublished !== false && !purchasedIds.includes(c._id || c.id))
      .slice(0, limit)
      .map(c => ({
        id: c._id || c.id,
        _id: c._id || c.id,
        title: c.title,
        description: c.description,
        instructor: c.instructor,
        thumbnail: c.thumbnail,
        price: c.price,
        discountPrice: c.discountPrice,
        isFree: c.isFree,
        level: c.level,
        category: c.category,
        rating: c.rating || 4.9,
        ratingCount: c.ratingCount || 150,
        enrolledCount: c.enrolledCount || 800,
      }));
  }

  /**
   * Get student course progress & completed lesson IDs
   */
  async getCourseProgress(userId, courseId) {
    if (!userId || !courseId) return { completedLessonIds: [], progressPercentage: 0 };

    if (ENV.DATABASE_URL) {
      try {
        const lpSql = `SELECT lesson_id FROM lesson_progress WHERE user_id = $1 AND course_id = $2 AND is_completed = true`;
        const lpRes = await query(lpSql, [userId, courseId]);
        const completedLessonIds = lpRes.rows.map(r => r.lesson_id);

        const enrSql = `SELECT progress_percentage FROM enrollments WHERE user_id = $1 AND course_id = $2`;
        const enrRes = await query(enrSql, [userId, courseId]);
        const progressPercentage = enrRes.rows.length > 0 ? Number(enrRes.rows[0].progress_percentage) : 0;

        return { completedLessonIds, progressPercentage };
      } catch (err) {
        console.warn('StudentRepository getCourseProgress DB fallback:', err.message);
      }
    }

    const completed = (mockData.lessonProgress || [])
      .filter(lp => lp.userId === userId && lp.courseId === courseId && lp.isCompleted)
      .map(lp => lp.lessonId);

    const enr = (mockData.enrollments || []).find(e => e.userId === userId && e.courseId === courseId);
    return {
      completedLessonIds: completed,
      progressPercentage: enr?.progressPercentage || 0,
    };
  }

  /**
   * Mark or toggle lesson completion status and recalculate course progress
   */
  async toggleLessonProgress(userId, courseId, lessonId, isCompleted = true) {
    if (ENV.DATABASE_URL) {
      try {
        const id = uuidv4();
        const upsertSql = `
          INSERT INTO lesson_progress (id, user_id, course_id, lesson_id, is_completed, completed_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
          ON CONFLICT (user_id, lesson_id) 
          DO UPDATE SET is_completed = $5, updated_at = NOW()
          RETURNING *
        `;
        await query(upsertSql, [id, userId, courseId, lessonId, isCompleted]);

        // Calculate new progress percentage
        const totalLessonsSql = `
          SELECT COUNT(*) as total FROM lessons l
          JOIN chapters ch ON l.chapter_id = ch.id
          JOIN subjects su ON ch.subject_id = su.id
          WHERE su.course_id = $1
        `;
        const totalRes = await query(totalLessonsSql, [courseId]);
        const totalCount = parseInt(totalRes.rows[0]?.total || 1, 10);

        const completedSql = `
          SELECT COUNT(*) as completed FROM lesson_progress 
          WHERE user_id = $1 AND course_id = $2 AND is_completed = true
        `;
        const compRes = await query(completedSql, [userId, courseId]);
        const completedCount = parseInt(compRes.rows[0]?.completed || 0, 10);

        const newPercentage = Math.min(100, Math.round((completedCount / Math.max(1, totalCount)) * 100));

        await query(
          `UPDATE enrollments SET progress_percentage = $1, updated_at = NOW() WHERE user_id = $2 AND course_id = $3`,
          [newPercentage, userId, courseId]
        );

        return { lessonId, isCompleted, progressPercentage: newPercentage };
      } catch (err) {
        console.warn('StudentRepository toggleLessonProgress DB fallback:', err.message);
      }
    }

    // Mock store
    if (!mockData.lessonProgress) mockData.lessonProgress = [];
    const existing = mockData.lessonProgress.find(lp => lp.userId === userId && lp.lessonId === lessonId);
    if (existing) {
      existing.isCompleted = isCompleted;
      existing.completedAt = isCompleted ? new Date() : null;
    } else {
      mockData.lessonProgress.push({
        _id: uuidv4(),
        userId,
        courseId,
        lessonId,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      });
    }

    const enr = (mockData.enrollments || []).find(e => e.userId === userId && e.courseId === courseId);
    if (enr) {
      const userComps = mockData.lessonProgress.filter(lp => lp.userId === userId && lp.courseId === courseId && lp.isCompleted);
      enr.progressPercentage = Math.min(100, Math.round((userComps.length / 4) * 100));
    }

    return { lessonId, isCompleted, progressPercentage: enr?.progressPercentage || 0 };
  }

  /**
   * Get student recent activities (enrollments, purchases, completions)
   */
  async getRecentActivities(userId) {
    const activities = [];

    // 1. Course Enrollments
    const enrolled = await this.getEnrolledCourses(userId);
    enrolled.forEach(c => {
      activities.push({
        id: `act_enr_${c.id}`,
        type: 'ENROLLMENT',
        title: `Enrolled in ${c.title}`,
        description: `Started learning with ${c.totalLessons} curated lessons`,
        timestamp: c.enrolledAt,
        badge: 'Course',
        link: `/courses/${c.id}/watch`,
      });
    });

    // 2. Note Purchases
    const notes = await this.getPurchasedNotes(userId);
    notes.forEach(n => {
      activities.push({
        id: `act_note_${n.id}`,
        type: 'NOTE_PURCHASE',
        title: `Purchased ${n.title}`,
        description: `Unlocked full digital notes (${n.fileSize})`,
        timestamp: n.purchasedAt,
        badge: 'Note',
        link: `/notes`,
      });
    });

    // Sort descending by timestamp
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
  }
}

export const studentRepository = new StudentRepository();
export default studentRepository;
