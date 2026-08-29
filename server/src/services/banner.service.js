import { bannerRepository } from '../repositories/banner.repository.js';
import { AppError } from '../utils/apiResponse.js';

/**
 * Banner Service
 * Handles business logic, validation, and retrieval for Home Page sliding and promotional banners.
 */
export class BannerService {
  /**
   * Retrieve active banners for public home carousel
   */
  async getActiveBanners() {
    return bannerRepository.findAll({ activeOnly: true });
  }

  /**
   * Retrieve all banners for admin management
   */
  async getAllBanners() {
    return bannerRepository.findAll({ activeOnly: false });
  }

  /**
   * Retrieve banner by ID
   */
  async getBannerById(id) {
    if (!id) throw new AppError('Banner ID is required', 400);
    const banner = await bannerRepository.findById(id);
    if (!banner) throw new AppError('Banner not found', 404);
    return banner;
  }

  /**
   * Create a new banner
   */
  async createBanner(data) {
    if (!data.title || data.title.trim() === '') {
      throw new AppError('Banner title is required', 400);
    }
    return bannerRepository.create(data);
  }

  /**
   * Update an existing banner
   */
  async updateBanner(id, data) {
    if (!id) throw new AppError('Banner ID is required', 400);
    const existing = await bannerRepository.findById(id);
    if (!existing) throw new AppError('Banner not found', 404);
    const updated = await bannerRepository.update(id, data);
    return updated;
  }

  /**
   * Delete a banner
   */
  async deleteBanner(id) {
    if (!id) throw new AppError('Banner ID is required', 400);
    const existing = await bannerRepository.findById(id);
    if (!existing) throw new AppError('Banner not found', 404);
    const deleted = await bannerRepository.delete(id);
    if (!deleted) throw new AppError('Failed to delete banner', 500);
    return true;
  }
}

export const bannerService = new BannerService();
export default bannerService;
