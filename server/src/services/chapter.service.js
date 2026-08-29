import { chapterRepository } from '../repositories/chapter.repository.js';
import { subjectRepository } from '../repositories/subject.repository.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';

/**
 * Chapter Service - Business Logic for Chapters
 */
export class ChapterService {
  /**
   * Get chapters by subject ID
   */
  async getChaptersBySubject(subjectId) {
    if (!subjectId) {
      throw new AppError('Subject ID is required', HTTP_STATUS.BAD_REQUEST);
    }
    return await chapterRepository.findBySubjectId(subjectId);
  }

  /**
   * Get chapter by ID
   */
  async getChapterById(id) {
    const chapter = await chapterRepository.findById(id);
    if (!chapter) {
      throw new AppError('Chapter not found', HTTP_STATUS.NOT_FOUND);
    }
    return chapter;
  }

  /**
   * Create chapter under a subject
   */
  async createChapter(data) {
    const subjectId = data.subjectId || data.subject;
    if (!subjectId || !data.title) {
      throw new AppError('Subject ID and chapter title are required', HTTP_STATUS.BAD_REQUEST);
    }

    const subject = await subjectRepository.findById(subjectId);
    if (!subject) {
      throw new AppError('Parent subject does not exist', HTTP_STATUS.NOT_FOUND);
    }

    const existingChapters = await chapterRepository.findBySubjectId(subjectId);
    const order = data.order !== undefined ? Number(data.order) : existingChapters.length + 1;

    return await chapterRepository.create({
      subjectId,
      title: data.title,
      order,
    });
  }

  /**
   * Update chapter
   */
  async updateChapter(id, data) {
    const chapter = await chapterRepository.findById(id);
    if (!chapter) {
      throw new AppError('Chapter not found', HTTP_STATUS.NOT_FOUND);
    }

    return await chapterRepository.update(id, data);
  }

  /**
   * Reorder chapters
   */
  async reorderChapters(orders) {
    if (!Array.isArray(orders) || orders.length === 0) {
      throw new AppError('Orders must be a non-empty array of { id, order }', HTTP_STATUS.BAD_REQUEST);
    }
    await chapterRepository.reorder(orders);
    return true;
  }

  /**
   * Delete chapter
   */
  async deleteChapter(id) {
    const chapter = await chapterRepository.findById(id);
    if (!chapter) {
      throw new AppError('Chapter not found', HTTP_STATUS.NOT_FOUND);
    }
    await chapterRepository.delete(id);
    return true;
  }
}

export const chapterService = new ChapterService();
export default chapterService;
