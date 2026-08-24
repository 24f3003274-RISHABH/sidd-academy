import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { AppError } from '../utils/apiResponse.js';

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) return next(new AppError('User no longer exists.', 401));
    if (!user.isActive) return next(new AppError('Account deactivated. Contact admin.', 401));
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      if (user && user.isActive) req.user = user;
    }
    next();
  } catch (error) {
    next(); // continue without auth
  }
};
