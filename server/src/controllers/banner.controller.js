import Banner from '../models/Banner.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';

export const getActiveBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    sendSuccess(res, 200, 'Active banners fetched', { banners });
  } catch (error) {
    next(error);
  }
};

export const getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ order: 1 });
    sendSuccess(res, 200, 'All banners fetched', { banners });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    sendSuccess(res, 201, 'Banner created', { banner });
  } catch (error) {
    next(error);
  }
};

export const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!banner) throw new AppError('Banner not found', 404);
    sendSuccess(res, 200, 'Banner updated', { banner });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) throw new AppError('Banner not found', 404);
    sendSuccess(res, 200, 'Banner deleted');
  } catch (error) {
    next(error);
  }
};
