import { courseRepository } from '../repositories/course.repository.js';
import { subjectRepository } from '../repositories/subject.repository.js';
import { chapterRepository } from '../repositories/chapter.repository.js';
import { lessonRepository } from '../repositories/lesson.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { studentRepository } from '../repositories/student.repository.js';
import { videoService } from './video.service.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';

/**
 * Course Service - Business Logic for Courses
 */
export class CourseService {
  /**
   * Slug generator utility
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get all courses with pagination, search, and level filter
   */
  async getAllCourses(query = {}, user = null) {
    const isAdmin = (user?.role || '').toLowerCase() === 'admin';
    const userId = user?.id || user?._id;
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const search = query.search || '';
    const level = query.level || '';
    const excludePurchased = query.excludePurchased === 'true' || query.excludePurchased === true;

    // Only admins can see unpublished courses
    const isPublished = isAdmin ? (query.isPublished !== undefined ? query.isPublished === 'true' || query.isPublished === true : undefined) : true;

    let purchasedCourseIds = [];
    if (userId) {
      try {
        const enrolled = await studentRepository.getEnrolledCourses(userId);
        purchasedCourseIds = enrolled.map(c => c.id || c._id).filter(Boolean);
      } catch {
        purchasedCourseIds = [];
      }
    }

    const result = await courseRepository.findAll({
      search,
      level,
      isPublished,
      page,
      limit,
      isAdmin,
      excludeCourseIds: excludePurchased ? purchasedCourseIds : [],
    });

    if (userId && Array.isArray(result.courses)) {
      const purchasedSet = new Set(purchasedCourseIds);
      result.courses = result.courses.map(course => ({
        ...course,
        isEnrolled: purchasedSet.has(course.id || course._id),
      }));
    }

    return result;
  }

  /**
   * Get single course details by ID or Slug
   */
  async getCourseById(id, withHierarchy = true, user = null) {
    if (!id) {
      throw new AppError('Course ID or slug is required', HTTP_STATUS.BAD_REQUEST);
    }

    const course = withHierarchy
      ? await courseRepository.findByIdWithHierarchy(id)
      : await courseRepository.findById(id);

    if (!course) {
      throw new AppError('Course not found', HTTP_STATUS.NOT_FOUND);
    }

    const userId = user?.id || user?._id;
    const isAdmin = (user?.role || '').toLowerCase() === 'admin';
    const price = Number(course.price) || 0;
    const discountPrice = Number(course.discountPrice) || 0;
    const effectivePrice = discountPrice > 0 && discountPrice < price ? discountPrice : price;
    const isActuallyFree = effectivePrice <= 0;
    course.isEnrolled = Boolean(
      isActuallyFree ||
      isAdmin ||
      (userId && await orderRepository.checkUserEnrollment(userId, course.id))
    );

    return course;
  }

  /**
   * Create a new course (Admin only)
   */
  async createCourse(data) {
    if (!data.title || !data.description) {
      throw new AppError('Course title and description are required', HTTP_STATUS.BAD_REQUEST);
    }

    const isFree = data.isFree === true || data.isFree === 'true';
    const price = isFree ? 0 : (Number(data.price) || 0);
    const discountPrice = isFree ? 0 : (Number(data.discountPrice) || 0);

    if (price < 0 || discountPrice < 0) {
      throw new AppError('Price and discount price must be non-negative numbers', HTTP_STATUS.BAD_REQUEST);
    }

    if (discountPrice > price && price > 0) {
      throw new AppError('Discount price cannot exceed the original price', HTTP_STATUS.BAD_REQUEST);
    }

    const baseSlug = this.generateSlug(data.title);
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    return await courseRepository.create({
      ...data,
      slug,
      price,
      discountPrice,
      isFree: isFree || price === 0,
    });
  }

  /**
   * Update an existing course (Admin only)
   */
  async updateCourse(id, data) {
    const existing = await courseRepository.findById(id);
    if (!existing) {
      throw new AppError('Course not found', HTTP_STATUS.NOT_FOUND);
    }

    const updates = { ...data };
    if (updates.isFree !== undefined) {
      updates.isFree = updates.isFree === true || updates.isFree === 'true';
    }
    if (updates.isPublished !== undefined) {
      updates.isPublished = updates.isPublished === true || updates.isPublished === 'true';
    }

    if (updates.title && updates.title !== existing.title) {
      const baseSlug = this.generateSlug(updates.title);
      updates.slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    if (updates.isFree === true) {
      updates.price = 0;
      updates.discountPrice = 0;
    } else if (updates.price !== undefined || updates.discountPrice !== undefined) {
      const nextPrice = updates.price !== undefined ? Number(updates.price) : Number(existing.price || 0);
      const nextDiscount = updates.discountPrice !== undefined ? Number(updates.discountPrice) : Number(existing.discountPrice || 0);
      if (Number.isNaN(nextPrice) || nextPrice < 0 || Number.isNaN(nextDiscount) || nextDiscount < 0) {
        throw new AppError('Price and discount price must be non-negative numbers', HTTP_STATUS.BAD_REQUEST);
      }
      if (nextPrice > 0 && nextDiscount > nextPrice) {
        throw new AppError('Discount price cannot exceed the original price', HTTP_STATUS.BAD_REQUEST);
      }
      updates.price = nextPrice;
      updates.discountPrice = nextPrice === 0 ? 0 : nextDiscount;
      if (updates.isFree === undefined) {
        updates.isFree = nextPrice === 0;
      }
    }

    const updated = await courseRepository.update(id, updates);
    return updated;
  }

  /**
   * Delete course (Admin only)
   */
  async deleteCourse(id) {
    const existing = await courseRepository.findById(id);
    if (!existing) {
      throw new AppError('Course not found', HTTP_STATUS.NOT_FOUND);
    }

    const deleted = await courseRepository.delete(id);
    if (!deleted) {
      throw new AppError('Failed to delete course', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return true;
  }

  /**
   * Preview a YouTube Playlist or list of YouTube video links before importing
   */
  async previewPlaylist(input) {
    return await videoService.fetchPlaylistMetadata(input);
  }

  /**
   * Import a YouTube Playlist (or multiple YouTube videos) directly as a new Course
   * or into an existing Course / Subject / Chapter, preserving exact playlist order.
   */
  async importPlaylistAsCourse(data = {}) {
    let playlistMeta = null;
    let videosToImport = Array.isArray(data.videos) && data.videos.length > 0 ? data.videos : null;

    if (typeof videosToImport === 'string') {
      try {
        videosToImport = JSON.parse(videosToImport);
      } catch {
        videosToImport = null;
      }
    }

    if (!videosToImport || videosToImport.length === 0) {
      if (!data.playlistUrl && !data.videoUrls) {
        throw new AppError('Please provide a YouTube Playlist URL or video list to import', HTTP_STATUS.BAD_REQUEST);
      }
      playlistMeta = await videoService.fetchPlaylistMetadata(data.playlistUrl || data.videoUrls);
      videosToImport = playlistMeta.videos;
    }

    if (!videosToImport || videosToImport.length === 0) {
      throw new AppError('No videos found to import', HTTP_STATUS.BAD_REQUEST);
    }

    const freePreviewCount = data.freePreviewCount !== undefined ? Number(data.freePreviewCount) : 2;
    let targetCourse = null;

    if (data.courseId) {
      targetCourse = await courseRepository.findById(data.courseId);
      if (!targetCourse) {
        throw new AppError('Target course not found', HTTP_STATUS.NOT_FOUND);
      }
    } else {
      const courseTitle = (data.title || playlistMeta?.title || 'YouTube Playlist Course').trim();
      const courseDescription = (
        data.description ||
        playlistMeta?.description ||
        `Complete chapter-wise video lecture series for ${courseTitle} imported in exact YouTube playlist order by SIDD ACADEMY PRAYAGRAJ (@Sidacademyprayagraj).`
      ).trim();
      const price = Number(data.price) || 0;
      const discountPrice = Number(data.discountPrice) || 0;
      const isFree = data.isFree === true || data.isFree === 'true' || price <= 0;
      const thumbnail =
        data.thumbnail ||
        playlistMeta?.thumbnailUrl ||
        videosToImport[0]?.thumbnailUrl ||
        'https://img.youtube.com/vi/-StdzdYReuo/hqdefault.jpg';

      targetCourse = await this.createCourse({
        title: courseTitle,
        description: courseDescription,
        price,
        discountPrice,
        isFree,
        level: data.level || 'Class 12',
        category: data.category || 'Board & Competitive Exams',
        instructor: data.instructor || 'Siddhant Pandey & आकाश सर',
        duration: data.duration || `${videosToImport.length} Lectures`,
        totalDuration: data.duration || `${videosToImport.length} Lectures`,
        totalLessons: videosToImport.length,
        thumbnail,
        isPublished: true,
      });
    }

    const courseId = targetCourse.id || targetCourse._id;

    // 2. Resolve or create Subject
    let targetSubject = null;
    if (data.subjectId) {
      targetSubject = await subjectRepository.findById(data.subjectId);
    }
    if (!targetSubject) {
      const existingSubjects = await subjectRepository.findByCourseId(courseId);
      const subjectTitle = (data.subjectTitle || playlistMeta?.title || targetCourse.title || 'Main Subject').trim();
      targetSubject = await subjectRepository.create({
        courseId,
        name: subjectTitle,
        title: subjectTitle,
        order: existingSubjects.length + 1,
      });
    }
    const subjectId = targetSubject.id || targetSubject._id;

    // 3. Resolve or create Chapter
    let targetChapter = null;
    if (data.chapterId) {
      targetChapter = await chapterRepository.findById(data.chapterId);
    }
    if (!targetChapter) {
      const existingChapters = await chapterRepository.findBySubjectId(subjectId);
      const chapterTitle = (
        data.chapterTitle ||
        (playlistMeta?.title ? `Playlist: ${playlistMeta.title}` : `Chapter ${existingChapters.length + 1}: Video Lectures`)
      ).trim();
      targetChapter = await chapterRepository.create({
        subjectId,
        title: chapterTitle,
        order: existingChapters.length + 1,
      });
    }
    const chapterId = targetChapter.id || targetChapter._id;

    // 4. Create Lessons & Videos in exact YouTube Playlist order
    const existingLessons = await lessonRepository.findByChapterId(chapterId);
    const baseOrder = existingLessons.length;
    const isCourseFree = Boolean(targetCourse.isFree) || Number(targetCourse.price || 0) <= 0;
    const createdLessons = [];

    for (let i = 0; i < videosToImport.length; i++) {
      const item = videosToImport[i];
      const orderNum = baseOrder + i + 1;
      const vidId = item.videoId || item.youtubeId || videoService.extractYoutubeId(item.videoUrl);
      const videoUrl = item.videoUrl || (vidId ? `https://www.youtube.com/watch?v=${vidId}` : '');
      const playlistUrl = item.playlistUrl || data.playlistUrl || playlistMeta?.playlistUrl || '';
      const thumbnailUrl = item.thumbnailUrl || (vidId ? `https://img.youtube.com/vi/${vidId}/hqdefault.jpg` : '');
      const lessonIsFree =
        item.isFree !== undefined
          ? Boolean(item.isFree)
          : (isCourseFree || i < freePreviewCount);

      const lesson = await lessonRepository.create({
        chapterId,
        title: (item.title || `Lecture ${orderNum}`).trim(),
        description: (item.description || `Playlist Lecture #${orderNum} — ${targetCourse.title}`).trim(),
        duration: item.duration || '30:00',
        order: orderNum,
        classNumber: orderNum,
        isFree: lessonIsFree,
        isProtected: !lessonIsFree,
        videoUrl,
        playlistUrl,
        thumbnailUrl,
        videoProvider: 'youtube',
        skipVideoInsert: true,
      });

      const lessonId = lesson.id || lesson._id;
      await videoService.createVideo({
        lessonId,
        courseId,
        subjectId,
        chapterId,
        title: (item.title || `Lecture ${orderNum}`).trim(),
        description: item.description || '',
        videoUrl,
        playlistUrl,
        thumbnailUrl,
        durationSeconds: item.durationSeconds || videoService.parseDurationToSeconds(item.duration || '30:00'),
        order: orderNum,
        isFree: lessonIsFree,
      });

      createdLessons.push(lesson);
    }

    const fullCourse = await this.getCourseById(courseId, true);
    return {
      course: fullCourse,
      subject: targetSubject,
      chapter: targetChapter,
      importedCount: createdLessons.length,
      lessons: createdLessons,
    };
  }
}

export const courseService = new CourseService();
export default courseService;
