import { userRepository } from '../repositories/user.repository.js';
import { courseRepository } from '../repositories/course.repository.js';
import { noteRepository } from '../repositories/note.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { AppError } from '../utils/apiResponse.js';

/**
 * Admin Service
 * Orchestrates business logic for administrative dashboards, user management,
 * course/note analytics, and system-wide orders via PostgreSQL repositories.
 */
export class AdminService {
  /**
   * Aggregate high-level platform statistics for the administrative dashboard
   */
  async getDashboardStats() {
    const [totalUsers, totalCourses, totalNotes, totalOrders, totalRevenue, recentOrders] = await Promise.all([
      userRepository.countUsers({ excludeRole: 'admin' }),
      courseRepository.count(),
      noteRepository.count(),
      orderRepository.countPaid(),
      orderRepository.getTotalRevenue(),
      orderRepository.getRecentOrders(5),
    ]);

    return {
      totalUsers,
      totalCourses,
      totalNotes,
      totalOrders,
      totalRevenue,
      recentOrders,
    };
  }

  /**
   * Retrieve paginated users with optional search filtering (excludes admin by default)
   */
  async getAllUsers({ page = 1, limit = 10, search } = {}) {
    return userRepository.findAll({ page, limit, search, excludeRole: 'admin' });
  }

  /**
   * Retrieve detailed user profile by ID
   */
  async getUserById(id) {
    if (!id) throw new AppError('User ID is required', 400);
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  /**
   * Update role for a user
   */
  async updateUserRole(id, role) {
    if (!id) throw new AppError('User ID is required', 400);
    if (!role) throw new AppError('Role is required', 400);
    
    const validRoles = ['student', 'user', 'admin', 'instructor'];
    if (!validRoles.includes(role.toLowerCase())) {
      throw new AppError(`Invalid role "${role}". Allowed roles: ${validRoles.join(', ')}`, 400);
    }

    const updated = await userRepository.updateRole(id, role);
    if (!updated) throw new AppError('User not found', 404);
    return updated;
  }

  /**
   * Toggle active/suspended status for a user
   */
  async toggleUserStatus(id) {
    if (!id) throw new AppError('User ID is required', 400);
    const updated = await userRepository.toggleStatus(id);
    if (!updated) throw new AppError('User not found', 404);
    return updated;
  }

  /**
   * Retrieve all platform orders with status/search filtering and pagination
   */
  async getAllOrders({ page = 1, limit = 10, status, search } = {}) {
    return orderRepository.findAll({ page, limit, status, search });
  }
}

export const adminService = new AdminService();
export default adminService;
