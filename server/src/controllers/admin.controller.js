import { adminService } from '../services/admin.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Admin Controller
 * Handles administrative dashboard statistics, user management, and order monitoring.
 * Adheres strictly to PERN architecture: route -> controller -> service -> repository -> PostgreSQL.
 */

/**
 * GET /api/v1/admin/dashboard
 * Aggregated analytics and stats for the admin control panel
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return sendSuccess(res, 200, 'Dashboard stats fetched', stats);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/users
 * Paginated student and user list with search support
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search;

    const result = await adminService.getAllUsers({ page, limit, search });
    return sendSuccess(res, 200, 'Users fetched', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/users/:id
 * Detailed user information by ID
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    return sendSuccess(res, 200, 'User fetched', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/users/:id/role
 * Modify user access role (e.g., student, admin, instructor)
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const user = await adminService.updateUserRole(req.params.id, req.body.role);
    return sendSuccess(res, 200, 'User role updated', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/admin/users/:id/status
 * Toggle user active/suspended account state
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await adminService.toggleUserStatus(req.params.id);
    return sendSuccess(res, 200, 'User status toggled', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/orders
 * Paginated list of all platform orders with search and status filters
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const status = req.query.status || req.query.paymentStatus;
    const search = req.query.search;

    const result = await adminService.getAllOrders({ page, limit, status, search });
    return sendSuccess(res, 200, 'Orders fetched', result);
  } catch (error) {
    next(error);
  }
};
