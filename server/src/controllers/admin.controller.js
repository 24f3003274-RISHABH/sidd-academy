import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Course from '../models/Course.model.js';
import Note from '../models/Note.model.js';
import Order from '../models/Order.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';
import { mockData } from '../data/mockStore.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const [totalUsers, totalCourses, totalNotes, totalOrders] = await Promise.all([
        User.countDocuments({ role: 'user' }),
        Course.countDocuments(),
        Note.countDocuments(),
        Order.countDocuments({ paymentStatus: 'paid' })
      ]);

      const revenueResult = await Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
      ]);
      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

      const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email');

      return sendSuccess(res, 200, 'Dashboard stats fetched', {
        totalUsers,
        totalCourses,
        totalNotes,
        totalOrders,
        totalRevenue,
        recentOrders
      });
    }

    // In-memory fallback stats
    const totalUsers = mockData.users.filter(u => u.role !== 'admin').length;
    const totalCourses = mockData.courses.length;
    const totalNotes = mockData.notes.length;
    const paidOrders = mockData.orders.filter(o => o.paymentStatus === 'paid');
    const totalOrders = paidOrders.length;
    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const recentOrders = mockData.orders.slice(0, 5);

    return sendSuccess(res, 200, 'Dashboard stats fetched', {
      totalUsers,
      totalCourses,
      totalNotes,
      totalOrders,
      totalRevenue,
      recentOrders
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (mongoose.connection.readyState === 1) {
      const query = { role: { $ne: 'admin' } };
      if (req.query.search) {
        query.$or = [
          { name: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } }
        ];
      }

      const total = await User.countDocuments(query);
      const users = await User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });

      return sendSuccess(res, 200, 'Users fetched', { users, total, page, pages: Math.ceil(total / limit) });
    }

    let filtered = mockData.users.filter(u => u.role !== 'admin');
    if (req.query.search) {
      const s = req.query.search.toLowerCase();
      filtered = filtered.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    const total = filtered.length;
    const users = filtered.slice(skip, skip + limit);
    return sendSuccess(res, 200, 'Users fetched', { users, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.params.id);
      if (!user) throw new AppError('User not found', 404);
      return sendSuccess(res, 200, 'User fetched', { user });
    }
    const user = mockData.users.find(u => u._id === req.params.id);
    if (!user) throw new AppError('User not found', 404);
    return sendSuccess(res, 200, 'User fetched', { user });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
      if (!user) throw new AppError('User not found', 404);
      return sendSuccess(res, 200, 'User role updated', { user });
    }
    const user = mockData.users.find(u => u._id === req.params.id);
    if (!user) throw new AppError('User not found', 404);
    user.role = req.body.role;
    return sendSuccess(res, 200, 'User role updated', { user });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.params.id);
      if (!user) throw new AppError('User not found', 404);
      user.isActive = !user.isActive;
      await user.save();
      return sendSuccess(res, 200, 'User status toggled', { user });
    }
    const user = mockData.users.find(u => u._id === req.params.id);
    if (!user) throw new AppError('User not found', 404);
    user.isActive = !user.isActive;
    return sendSuccess(res, 200, 'User status toggled', { user });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (req.query.paymentStatus) {
        query.paymentStatus = req.query.paymentStatus;
      }

      const total = await Order.countDocuments(query);
      const orders = await Order.find(query)
        .populate('user', 'name email')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      return sendSuccess(res, 200, 'Orders fetched', { orders, total, page, pages: Math.ceil(total / limit) });
    }

    let filtered = [...mockData.orders];
    if (req.query.paymentStatus) {
      filtered = filtered.filter(o => o.paymentStatus === req.query.paymentStatus);
    }
    const total = filtered.length;
    const orders = filtered.slice(skip, skip + limit);
    return sendSuccess(res, 200, 'Orders fetched', { orders, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    next(error);
  }
};

