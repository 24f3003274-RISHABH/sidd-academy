/**
 * Authentication & Authorization Middleware Re-exports
 * Facilitates backwards compatibility while providing standardized authenticate & authorize interfaces.
 */
export { authenticate, protect, optionalAuth } from './authenticate.js';
export { authorize, adminOnly, restrictTo } from './authorize.js';
