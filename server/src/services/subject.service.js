import { subjectRepository } from '../repositories/subject.repository.js';
import { courseRepository } from '../repositories/course.repository.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';

/**
 * Subject Service - Business Logic for Subjects
 */
export class SubjectService {
  /**
   * Get subjects by course ID
   */
  async getSubjectsByCourse(courseId) {
    if (!courseId) {
      throw new AppError('Course ID is required', HTTP_STATUS.BAD_REQUEST);
    }
    return await subjectRepository.findByCourseId(courseId);
  }

  /**
   * Get single subject by ID
   */
  async getSubjectById(id) {
    const subject = await subjectRepository.findById(id);
    if (!subject) {
      throw new AppError('Subject not found', HTTP_STATUS.NOT_FOUND);
    }
    return subject;
  }

  /**
   * Create subject under a course
   */
  async createSubject(data) {
    const courseId = data.courseId || data.course;
    if (!courseId || !data.name) {
      throw new AppError('Course ID and subject name are required', HTTP_STATUS.BAD_REQUEST);
    }

    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Parent course does not exist', HTTP_STATUS.NOT_FOUND);
    }

    const existingSubjects = await subjectRepository.findByCourseId(courseId);
    const order = data.order !== undefined ? Number(data.order) : existingSubjects.length + 1;

    return await subjectRepository.create({
      courseId,
      name: data.name,
      order,
    });
  }

  /**
   * Update subject
   */
  async updateSubject(id, data) {
    const subject = await subjectRepository.findById(id);
    if (!subject) {
      throw new AppError('Subject not found', HTTP_STATUS.NOT_FOUND);
    }

    return await subjectRepository.update(id, data);
  }

  /**
   * Reorder subjects
   */
  async reorderSubjects(orders) {
    if (!Array.isArray(orders) || orders.length === 0) {
      throw new AppError('Orders must be a non-empty array of { id, order }', HTTP_STATUS.BAD_REQUEST);
    }
    await subjectRepository.reorder(orders);
    return true;
  }

  /**
   * Delete subject
   */
  async deleteSubject(id) {
    const subject = await subjectRepository.findById(id);
    if (!subject) {
      throw new AppError('Subject not found', HTTP_STATUS.NOT_FOUND);
    }
    await subjectRepository.delete(id);
    return true;
  }
}

export const subjectService = new SubjectService();
export default subjectService;
