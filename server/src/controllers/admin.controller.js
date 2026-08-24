import User from '../models/User.model.js';
import Course from '../models/Course.model.js';
import Note from '../models/Note.model.js';
import Order from '../models/Order.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';

export const getDashboardStats = async (req, res, next) => {
  try {
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

    sendSuccess(res, 200, 'Dashboard stats fetched', {
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

    const query = { role: { $ne: 'admin' } };
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });

    sendSuccess(res, 200, 'Users fetched', { users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, 200, 'User fetched', { user });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
    if (!user) throw new AppError('User not found', 404);
    sendSuccess(res, 200, 'User role updated', { user });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    user.isActive = !user.isActive;
    await user.save();
    sendSuccess(res, 200, 'User status toggled', { user });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

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

    sendSuccess(res, 200, 'Orders fetched', { orders, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};
