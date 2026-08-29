import { courseRepository } from '../repositories/course.repository.js';
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
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const search = query.search || '';
    const level = query.level || '';

    // Only admins can see unpublished courses
    const isPublished = isAdmin ? (query.isPublished !== undefined ? query.isPublished === 'true' || query.isPublished === true : undefined) : true;

    return await courseRepository.findAll({
      search,
      level,
      isPublished,
      page,
      limit,
      isAdmin,
    });
  }

  /**
   * Get single course details by ID or Slug
   */
  async getCourseById(id, withHierarchy = true) {
    if (!id) {
      throw new AppError('Course ID or slug is required', HTTP_STATUS.BAD_REQUEST);
    }

    const course = withHierarchy
      ? await courseRepository.findByIdWithHierarchy(id)
      : await courseRepository.findById(id);

    if (!course) {
      throw new AppError('Course not found', HTTP_STATUS.NOT_FOUND);
    }

    return course;
  }

  /**
   * Create a new course (Admin only)
   */
  async createCourse(data) {
    if (!data.title || !data.description) {
      throw new AppError('Course title and description are required', HTTP_STATUS.BAD_REQUEST);
    }

    const price = Number(data.price) || 0;
    const discountPrice = Number(data.discountPrice) || 0;

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

    if (updates.title && updates.title !== existing.title) {
      const baseSlug = this.generateSlug(updates.title);
      updates.slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    if (updates.price !== undefined && Number(updates.price) < 0) {
      throw new AppError('Price must be a non-negative number', HTTP_STATUS.BAD_REQUEST);
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
}

export const courseService = new CourseService();
export default courseService;
