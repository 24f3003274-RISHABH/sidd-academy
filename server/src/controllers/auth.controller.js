import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie, sendWelcomeEmail } from '../utils/auth.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      throw new AppError('Please provide name, email and password', 400);
    }
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
    
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    user.refreshToken = refreshToken;
    await user.save();
    
    setRefreshTokenCookie(res, refreshToken);
    
    sendSuccess(res, 201, 'Registration successful', {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token: accessToken,
    });
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
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }
    
    user.lastLogin = Date.now();
    
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    user.refreshToken = refreshToken;
    await user.save();
    
    setRefreshTokenCookie(res, refreshToken);
    
    sendSuccess(res, 200, 'Login successful', {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      token: accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = undefined;
      await user.save();
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
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      throw new AppError('Invalid refresh token', 401);
    }
    const accessToken = generateAccessToken(user._id);
    sendSuccess(res, 200, 'Token refreshed', { token: accessToken });
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
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    );
    sendSuccess(res, 200, 'Profile updated', { user });
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
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new AppError('Incorrect old password', 400);
    }
    user.password = newPassword;
    await user.save();
    sendSuccess(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
