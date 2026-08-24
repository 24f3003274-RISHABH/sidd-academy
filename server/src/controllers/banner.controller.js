import mongoose from 'mongoose';
import Banner from '../models/Banner.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';
import { mockData } from '../data/mockStore.js';

export const getActiveBanners = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
      return sendSuccess(res, 200, 'Active banners fetched', { banners });
    }
    const banners = mockData.banners.filter(b => b.isActive).sort((a, b) => (a.order || 0) - (b.order || 0));
    return sendSuccess(res, 200, 'Active banners fetched', { banners });
  } catch (error) {
    next(error);
  }
};

export const getAllBanners = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const banners = await Banner.find().sort({ order: 1 });
      return sendSuccess(res, 200, 'All banners fetched', { banners });
    }
    return sendSuccess(res, 200, 'All banners fetched', { banners: mockData.banners });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const banner = await Banner.create(req.body);
      return sendSuccess(res, 201, 'Banner created', { banner });
    }
    const newBanner = {
      _id: `banner_${Date.now()}`,
      ...req.body,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      order: req.body.order || mockData.banners.length + 1
    };
    mockData.banners.push(newBanner);
    return sendSuccess(res, 201, 'Banner created', { banner: newBanner });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!banner) throw new AppError('Banner not found', 404);
      return sendSuccess(res, 200, 'Banner updated', { banner });
    }
    const idx = mockData.banners.findIndex(b => b._id === req.params.id);
    if (idx === -1) throw new AppError('Banner not found', 404);
    mockData.banners[idx] = { ...mockData.banners[idx], ...req.body };
    return sendSuccess(res, 200, 'Banner updated', { banner: mockData.banners[idx] });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const banner = await Banner.findByIdAndDelete(req.params.id);
      if (!banner) throw new AppError('Banner not found', 404);
      return sendSuccess(res, 200, 'Banner deleted');
    }
    const idx = mockData.banners.findIndex(b => b._id === req.params.id);
    if (idx === -1) throw new AppError('Banner not found', 404);
    mockData.banners.splice(idx, 1);
    return sendSuccess(res, 200, 'Banner deleted');
  } catch (error) {
    next(error);
  }
};

