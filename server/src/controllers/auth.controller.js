import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '../utils/generateToken.js';
import { sendWelcomeEmail } from '../utils/sendEmail.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';
import { mockData } from '../data/mockStore.js';

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sidd_academy_refresh_secret_2024_secure_key';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw new AppError('Please provide name, email and password', 400);
    }

    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError('Email already exists', 400);
      }
      const user = await User.create({ name, email, password });
      
      try {
        await sendWelcomeEmail(user.email, user.name);
      } catch (err) {
        console.error('Failed to send welcome email', err);
      }
      
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);
      
      user.refreshToken = refreshToken;
      await user.save();
      
      setRefreshTokenCookie(res, refreshToken);
      
      return sendSuccess(res, 201, 'Registration successful', {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token: accessToken,
      });
    } else {
      // In-memory fallback
      const existing = mockData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        throw new AppError('Email already exists', 400);
      }
      const salt = bcrypt.genSaltSync(10);
      const newUser = {
        _id: `user_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        password: bcrypt.hashSync(password, salt),
        role: 'user',
        phone: req.body.phone || '',
        avatar: '',
        isActive: true,
        purchasedCourses: [],
        purchasedNotes: [],
        createdAt: new Date()
      };
      mockData.users.push(newUser);

      const accessToken = generateAccessToken(newUser._id, newUser.role);
      const refreshToken = generateRefreshToken(newUser._id);
      newUser.refreshToken = refreshToken;
      setRefreshTokenCookie(res, refreshToken);

      return sendSuccess(res, 201, 'Registration successful', {
        user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
        token: accessToken,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
      }
      
      user.lastLogin = Date.now();
      
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);
      
      user.refreshToken = refreshToken;
      await user.save();
      
      setRefreshTokenCookie(res, refreshToken);
      
      return sendSuccess(res, 200, 'Login successful', {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        token: accessToken,
      });
    } else {
      // In-memory fallback
      const user = mockData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }
      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
      }
      
      user.lastLogin = Date.now();
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);
      user.refreshToken = refreshToken;
      setRefreshTokenCookie(res, refreshToken);

      return sendSuccess(res, 200, 'Login successful', {
        user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
        token: accessToken,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    } else {
      const user = mockData.users.find(u => u._id === req.user._id || u.id === req.user._id);
      if (user) {
        delete user.refreshToken;
      }
    }
    res.clearCookie('refreshToken');
    sendSuccess(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      throw new AppError('Not authorized, no refresh token', 401);
    }
    const decoded = jwt.verify(token, REFRESH_SECRET);
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.id);
      if (!user || user.refreshToken !== token) {
        throw new AppError('Invalid refresh token', 401);
      }
      const accessToken = generateAccessToken(user._id, user.role);
      return sendSuccess(res, 200, 'Token refreshed', { token: accessToken });
    } else {
      const user = mockData.users.find(u => u._id === decoded.id || u.id === decoded.id);
      if (!user || user.refreshToken !== token) {
        throw new AppError('Invalid refresh token', 401);
      }
      const accessToken = generateAccessToken(user._id, user.role);
      return sendSuccess(res, 200, 'Token refreshed', { token: accessToken });
    }
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    sendSuccess(res, 200, 'User profile fetched', { user: req.user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    if (mongoose.connection.readyState === 1) {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { name, phone, avatar },
        { new: true, runValidators: true }
      );
      sendSuccess(res, 200, 'Profile updated', { user });
    } else {
      const user = mockData.users.find(u => u._id === req.user._id || u.id === req.user._id);
      if (user) {
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (avatar) user.avatar = avatar;
      }
      sendSuccess(res, 200, 'Profile updated', { user });
    }
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      throw new AppError('Please provide old and new password', 400);
    }
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id).select('+password');
      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) {
        throw new AppError('Incorrect old password', 400);
      }
      user.password = newPassword;
      await user.save();
      sendSuccess(res, 200, 'Password changed successfully');
    } else {
      const user = mockData.users.find(u => u._id === req.user._id || u.id === req.user._id);
      if (!user) throw new AppError('User not found', 404);
      const isMatch = bcrypt.compareSync(oldPassword, user.password);
      if (!isMatch) {
        throw new AppError('Incorrect old password', 400);
      }
      const salt = bcrypt.genSaltSync(10);
      user.password = bcrypt.hashSync(newPassword, salt);
      sendSuccess(res, 200, 'Password changed successfully');
    }
  } catch (error) {
    next(error);
  }
};

