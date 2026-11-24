import { userRepository } from '../repositories/user.repository.js';
import { courseRepository } from '../repositories/course.repository.js';
import { noteRepository } from '../repositories/note.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { bannerRepository } from '../repositories/banner.repository.js';
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
    const [
      totalUsers,
      totalStudents,
      totalCourses,
      publishedCourses,
      totalNotes,
      publishedNotes,
      activeBanners,
      totalBanners,
      totalOrders,
      totalRevenue,
      orderBreakdown,
      recentOrders,
      recentUsers,
    ] = await Promise.all([
      userRepository.countUsers({ excludeRole: null }),
      userRepository.countUsers({ excludeRole: 'admin' }),
      courseRepository.count(),
      courseRepository.count({ isPublished: true }),
      noteRepository.count(),
      noteRepository.count({ isPublished: true }),
      bannerRepository.count({ activeOnly: true }),
      bannerRepository.count(),
      orderRepository.countPaid(),
      orderRepository.getTotalRevenue(),
      orderRepository.getOrderStatusBreakdown(),
      orderRepository.getRecentOrders(6),
      userRepository.getRecentUsers(5),
    ]);

    return {
      totalUsers,
      totalStudents,
      totalCourses,
      publishedCourses,
      draftCourses: Math.max(0, totalCourses - publishedCourses),
      totalNotes,
      publishedNotes,
      draftNotes: Math.max(0, totalNotes - publishedNotes),
      activeBanners,
      totalBanners,
      totalOrders,
      totalRevenue,
      orderBreakdown,
      recentOrders: (recentOrders || []).map(o => ({
        ...o,
        id: o.id || o._id,
        _id: o.id || o._id,
      })),
      recentUsers: (recentUsers || []).map(u => ({
        ...u,
        id: u.id || u._id,
        _id: u.id || u._id,
      })),
    };
  }

  /**
   * Retrieve paginated users with optional search and role filtering
   */
  async getAllUsers({ page = 1, limit = 10, search, role } = {}) {
    return userRepository.findAll({ page, limit, search, role, excludeRole: null });
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
  async updateUserRole(id, role, actorId = null) {
    if (!id) throw new AppError('User ID is required', 400);
    if (!role) throw new AppError('Role is required', 400);
    if (actorId && String(id) === String(actorId)) {
      throw new AppError('You cannot change your own admin role.', 400);
    }

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
  async toggleUserStatus(id, actorId = null) {
    if (!id) throw new AppError('User ID is required', 400);
    if (actorId && String(id) === String(actorId)) {
      throw new AppError('You cannot suspend or deactivate your own admin account.', 400);
    }
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
