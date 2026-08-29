import { bannerService } from '../services/banner.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Banner Controller
 * Endpoints for public hero banner carousel and administrative banner CRUD.
 * Adheres strictly to PERN architecture: route -> controller -> service -> repository -> PostgreSQL.
 */

/**
 * GET /api/v1/banners/active
 * Fetch active banners ordered for home page carousel
 */
export const getActiveBanners = async (req, res, next) => {
  try {
    const banners = await bannerService.getActiveBanners();
    return sendSuccess(res, 200, 'Active banners fetched', { banners });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/banners
 * Fetch all banners (Admin only)
 */
export const getAllBanners = async (req, res, next) => {
  try {
    const banners = await bannerService.getAllBanners();
    return sendSuccess(res, 200, 'All banners fetched', { banners });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/banners
 * Create new banner (Admin only)
 */
export const createBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.createBanner(req.body);
    return sendSuccess(res, 201, 'Banner created', { banner });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/banners/:id
 * Update banner (Admin only)
 */
export const updateBanner = async (req, res, next) => {
  try {
    const banner = await bannerService.updateBanner(req.params.id, req.body);
    return sendSuccess(res, 200, 'Banner updated', { banner });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/banners/:id
 * Delete banner (Admin only)
 */
export const deleteBanner = async (req, res, next) => {
  try {
    await bannerService.deleteBanner(req.params.id);
    return sendSuccess(res, 200, 'Banner deleted');
  } catch (error) {
    next(error);
  }
};
