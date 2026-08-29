/**
 * Application Constants
 * Defines core enums, roles, status codes, and global configuration values
 */

export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  USER: 'user', // legacy alias for student
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  // Lowercase aliases for db backward compatibility
  pending: 'PENDING',
  paid: 'PAID',
  failed: 'FAILED',
  cancelled: 'CANCELLED',
};

export const PAYMENT_STATUS = {
  CREATED: 'CREATED',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  // Lowercase aliases
  created: 'CREATED',
  initiated: 'CREATED',
  completed: 'SUCCESS',
  success: 'SUCCESS',
  failed: 'FAILED',
};

export const COURSE_LEVELS = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'All Levels',
};

export const ITEM_TYPES = {
  COURSE: 'course',
  NOTE: 'note',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};
