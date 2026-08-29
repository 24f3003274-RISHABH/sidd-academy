import { AppError } from '../utils/apiResponse.js';

/**
 * SECURITY-SENSITIVE: Role-Based Authorization Middleware (RBAC)
 * 
 * Enforces endpoint access policies based on assigned user roles.
 * 
 * Supported Roles:
 * - 'ADMIN' / 'admin'
 * - 'STUDENT' / 'student' (also accepts legacy alias 'user')
 * 
 * Usage Examples:
 * - `router.get('/admin/dashboard', authenticate, authorize('ADMIN'), adminController.getDashboardStats);`
 * - `router.get('/student/notes', authenticate, authorize('STUDENT', 'ADMIN'), notesController.getMyNotes);`
 * - `router.use(authenticate, authorize(['ADMIN']));`
 * 
 * Returns:
 * - 401 Unauthorized if user is unauthenticated
 * - 403 Forbidden if user lacks required role
 */
export const authorize = (...allowedRoles) => {
  // Flatten array arguments in case roles are passed as array or multiple string arguments
  const flattenedRoles = allowedRoles.flat().map(r => String(r).toUpperCase().trim());

  return (req, res, next) => {
    // 1. Verify user context exists (must be preceded by authenticate middleware)
    if (!req.user) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    // 2. Normalize current user's role to uppercase
    const rawRole = (req.user.role || '').toUpperCase().trim();
    const userRole = rawRole === 'USER' ? 'STUDENT' : rawRole;

    // 3. Match against allowed role list
    const hasRole = flattenedRoles.includes(userRole);

    if (!hasRole) {
      return next(new AppError(
        `Access denied. Role '${userRole}' is not authorized to access this resource. Required: ${flattenedRoles.join(', ')}`,
        403
      ));
    }

    next();
  };
};

/**
 * Shorthand helper for Admin-only routes
 */
export const adminOnly = authorize('ADMIN');

/**
 * Alias for restrictTo
 */
export const restrictTo = authorize;

export default authorize;
