import { AppError } from '../utils/apiResponse.js';

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return next(new AppError('Access denied. Admin privileges required.', 403));
};
