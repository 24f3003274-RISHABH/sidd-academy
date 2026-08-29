import { lessonRepository } from '../repositories/lesson.repository.js';
import { chapterRepository } from '../repositories/chapter.repository.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';

/**
 * Lesson / Daily Class Service - Business Logic for Classes
 */
export class LessonService {
  /**
   * Get lessons by chapter ID
   */
  async getLessonsByChapter(chapterId) {
    if (!chapterId) {
      throw new AppError('Chapter ID is required', HTTP_STATUS.BAD_REQUEST);
    }
    return await lessonRepository.findByChapterId(chapterId);
  }

  /**
   * Get single lesson by ID
   */
  async getLessonById(id) {
    const lesson = await lessonRepository.findById(id);
    if (!lesson) {
      throw new AppError('Lesson / Daily Class not found', HTTP_STATUS.NOT_FOUND);
    }
    return lesson;
  }

  /**
   * Create lesson under a chapter
   */
  async createLesson(data) {
    const chapterId = data.chapterId || data.chapter;
    if (!chapterId || !data.title) {
      throw new AppError('Chapter ID and lesson title are required', HTTP_STATUS.BAD_REQUEST);
    }

    const chapter = await chapterRepository.findById(chapterId);
    if (!chapter) {
      throw new AppError('Parent chapter does not exist', HTTP_STATUS.NOT_FOUND);
    }

    const existing = await lessonRepository.findByChapterId(chapterId);
    const order = data.order !== undefined ? Number(data.order) : existing.length + 1;

    return await lessonRepository.create({
      chapterId,
      title: data.title,
      classDate: data.classDate || new Date().toISOString(),
      duration: Number(data.duration) || 60,
      order,
      isLive: Boolean(data.isLive),
      videoUrl: data.videoUrl || '',
      videoProvider: data.videoProvider || 'youtube',
    });
  }

  /**
   * Update lesson / set class date / set lesson order
   */
  async updateLesson(id, data) {
    const lesson = await lessonRepository.findById(id);
    if (!lesson) {
      throw new AppError('Lesson / Daily Class not found', HTTP_STATUS.NOT_FOUND);
    }

    return await lessonRepository.update(id, data);
  }

  /**
   * Reorder lessons
   */
  async reorderLessons(orders) {
    if (!Array.isArray(orders) || orders.length === 0) {
      throw new AppError('Orders must be a non-empty array of { id, order }', HTTP_STATUS.BAD_REQUEST);
    }
    await lessonRepository.reorder(orders);
    return true;
  }

  /**
   * Delete lesson
   */
  async deleteLesson(id) {
    const lesson = await lessonRepository.findById(id);
    if (!lesson) {
      throw new AppError('Lesson not found', HTTP_STATUS.NOT_FOUND);
    }
    await lessonRepository.delete(id);
    return true;
  }
}

export const lessonService = new LessonService();
export default lessonService;
