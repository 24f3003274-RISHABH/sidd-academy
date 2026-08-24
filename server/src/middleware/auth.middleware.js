import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import { AppError } from '../utils/apiResponse.js';
import { mockData } from '../data/mockStore.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'sidd_academy_access_secret_2024_secure_key';

const findUserById = async (id) => {
  if (mongoose.connection.readyState === 1) {
    return await User.findById(id).select('-password -refreshToken');
  }
  const u = mockData.users.find(user => user._id === id || user.id === id);
  if (!u) return null;
  const { password, refreshToken, ...safeUser } = u;
  return safeUser;
};

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }
    const decoded = jwt.verify(token, ACCESS_SECRET);
    const user = await findUserById(decoded.id);
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
      const decoded = jwt.verify(token, ACCESS_SECRET);
      const user = await findUserById(decoded.id);
      if (user && user.isActive) req.user = user;
    }
    next();
  } catch (error) {
    next(); // continue without auth
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Access denied. Administrator privileges required.', 403));
  }
  next();
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

