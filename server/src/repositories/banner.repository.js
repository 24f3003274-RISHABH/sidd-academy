import { query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Banner Repository - PostgreSQL / Supabase Data Access Layer
 * 
 * Manages database persistence for promotional and hero carousel banners.
 * Interacts with PostgreSQL `banners` table with mockStore in-memory fallback.
 */
export class BannerRepository {
  /**
   * Helper to normalize database rows into standardized API format
   */
  normalizeBanner(b) {
    if (!b) return null;
    const id = b.id || b._id;
    const orderNum = b.order_num !== undefined ? Number(b.order_num) : (b.order_index !== undefined ? Number(b.order_index) : (b.order !== undefined ? Number(b.order) : 0));
    const isActive = b.is_active !== undefined ? Boolean(b.is_active) : (b.isActive !== undefined ? Boolean(b.isActive) : true);
    const imageUrl = b.image_url || b.imageUrl || '';
    const linkUrl = b.link_url || b.linkUrl || b.target_url || b.targetUrl || '/courses';
    const buttonText = b.button_text || b.buttonText || 'Explore Now';
    const badge = b.badge || 'Featured';
    const bgColor = b.bg_color || b.bgColor || 'from-indigo-900 to-purple-900';

    return {
      id,
      _id: id,
      title: b.title,
      subtitle: b.subtitle || '',
      badge,
      imageUrl,
      image_url: imageUrl,
      linkUrl,
      link_url: linkUrl,
      targetUrl: linkUrl,
      buttonText,
      button_text: buttonText,
      isActive,
      is_active: isActive,
      order: orderNum,
      order_num: orderNum,
      order_index: orderNum,
      bgColor,
      bg_color: bgColor,
      createdAt: b.created_at || b.createdAt || new Date(),
      updatedAt: b.updated_at || b.updatedAt || new Date(),
    };
  }

  /**
   * Find all banners with optional active-only filter
   * @param {Object} options - { activeOnly: boolean }
   * @returns {Promise<Array>}
   */
  async findAll({ activeOnly = false } = {}) {
    if (ENV.DATABASE_URL) {
      try {
        let sql = `SELECT * FROM banners`;
        const params = [];
        if (activeOnly) {
          sql += ` WHERE is_active = true`;
        }
        sql += ` ORDER BY order_num ASC, created_at DESC`;

        const res = await query(sql, params);
        return res.rows.map(row => this.normalizeBanner(row));
      } catch (err) {
        console.warn('BannerRepository findAll fallback to mockStore:', err.message);
      }
    }

    if (!mockData.banners) mockData.banners = [];
    let list = [...mockData.banners];
    if (activeOnly) {
      list = list.filter(b => b.isActive !== false && b.is_active !== false);
    }
    list.sort((a, b) => {
      const orderA = a.order_num ?? a.order ?? 0;
      const orderB = b.order_num ?? b.order ?? 0;
      return orderA - orderB;
    });
    return list.map(b => this.normalizeBanner(b));
  }

  /**
   * Find banner by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `SELECT * FROM banners WHERE id = $1 LIMIT 1`;
        const res = await query(sql, [id]);
        if (res.rows.length > 0) {
          return this.normalizeBanner(res.rows[0]);
        }
      } catch (err) {
        console.warn('BannerRepository findById fallback to mockStore:', err.message);
      }
    }

    if (!mockData.banners) mockData.banners = [];
    const banner = mockData.banners.find(b => b.id === id || b._id === id);
    return banner ? this.normalizeBanner(banner) : null;
  }

  /**
   * Create a new banner in PostgreSQL
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async create(data) {
    const id = uuidv4();
    const title = data.title || 'Special Announcement';
    const subtitle = data.subtitle || '';
    const badge = data.badge || 'Featured';
    const imageUrl = data.imageUrl || data.image_url || '';
    const linkUrl = data.linkUrl || data.link_url || data.targetUrl || data.target_url || '/courses';
    const buttonText = data.buttonText || data.button_text || 'Explore Now';
    const isActive = data.isActive !== undefined ? Boolean(data.isActive) : (data.is_active !== undefined ? Boolean(data.is_active) : true);
    const orderNum = data.order_num !== undefined ? Number(data.order_num) : (data.order !== undefined ? Number(data.order) : 0);
    const bgColor = data.bgColor || data.bg_color || 'from-indigo-900 to-purple-900';

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          INSERT INTO banners (
            id, title, subtitle, badge, image_url, link_url, button_text, 
            is_active, order_num, bg_color, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          RETURNING *
        `;
        const res = await query(sql, [
          id, title, subtitle, badge, imageUrl, linkUrl, buttonText, isActive, orderNum, bgColor
        ]);
        if (res.rows.length > 0) {
          return this.normalizeBanner(res.rows[0]);
        }
      } catch (err) {
        console.warn('BannerRepository create fallback to mockStore:', err.message);
      }
    }

    const mockBanner = {
      id,
      _id: id,
      title,
      subtitle,
      badge,
      imageUrl,
      image_url: imageUrl,
      linkUrl,
      link_url: linkUrl,
      targetUrl: linkUrl,
      buttonText,
      button_text: buttonText,
      isActive,
      is_active: isActive,
      order: orderNum,
      order_num: orderNum,
      order_index: orderNum,
      bgColor,
      bg_color: bgColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!mockData.banners) mockData.banners = [];
    mockData.banners.push(mockBanner);
    return this.normalizeBanner(mockBanner);
  }

  /**
   * Update an existing banner
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object|null>}
   */
  async update(id, data) {
    if (!id) return null;

    const imageUrl = data.imageUrl || data.image_url;
    const linkUrl = data.linkUrl || data.link_url || data.targetUrl || data.target_url;
    const buttonText = data.buttonText || data.button_text;
    const isActive = data.isActive !== undefined ? Boolean(data.isActive) : (data.is_active !== undefined ? Boolean(data.is_active) : undefined);
    const orderNum = data.order_num !== undefined ? Number(data.order_num) : (data.order !== undefined ? Number(data.order) : undefined);
    const bgColor = data.bgColor || data.bg_color;

    if (ENV.DATABASE_URL) {
      try {
        const fields = [];
        const params = [id];
        let pIndex = 2;

        if (data.title !== undefined) { fields.push(`title = $${pIndex++}`); params.push(data.title); }
        if (data.subtitle !== undefined) { fields.push(`subtitle = $${pIndex++}`); params.push(data.subtitle); }
        if (data.badge !== undefined) { fields.push(`badge = $${pIndex++}`); params.push(data.badge); }
        if (imageUrl !== undefined) { fields.push(`image_url = $${pIndex++}`); params.push(imageUrl); }
        if (linkUrl !== undefined) { fields.push(`link_url = $${pIndex++}`); params.push(linkUrl); }
        if (buttonText !== undefined) { fields.push(`button_text = $${pIndex++}`); params.push(buttonText); }
        if (isActive !== undefined) { fields.push(`is_active = $${pIndex++}`); params.push(isActive); }
        if (orderNum !== undefined) { fields.push(`order_num = $${pIndex++}`); params.push(orderNum); }
        if (bgColor !== undefined) { fields.push(`bg_color = $${pIndex++}`); params.push(bgColor); }

        fields.push(`updated_at = NOW()`);

        if (fields.length === 1) {
          return this.findById(id);
        }

        const sql = `UPDATE banners SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
        const res = await query(sql, params);
        if (res.rows.length > 0) {
          return this.normalizeBanner(res.rows[0]);
        }
      } catch (err) {
        console.warn('BannerRepository update fallback to mockStore:', err.message);
      }
    }

    if (!mockData.banners) mockData.banners = [];
    const idx = mockData.banners.findIndex(b => b.id === id || b._id === id);
    if (idx === -1) return null;

    mockData.banners[idx] = {
      ...mockData.banners[idx],
      ...data,
      imageUrl: imageUrl ?? mockData.banners[idx].imageUrl,
      linkUrl: linkUrl ?? mockData.banners[idx].linkUrl,
      buttonText: buttonText ?? mockData.banners[idx].buttonText,
      isActive: isActive ?? mockData.banners[idx].isActive,
      order: orderNum ?? mockData.banners[idx].order,
      order_num: orderNum ?? mockData.banners[idx].order_num,
      updatedAt: new Date().toISOString(),
    };

    return this.normalizeBanner(mockData.banners[idx]);
  }

  /**
   * Delete a banner
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    if (!id) return false;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `DELETE FROM banners WHERE id = $1 RETURNING id`;
        const res = await query(sql, [id]);
        return res.rowCount > 0;
      } catch (err) {
        console.warn('BannerRepository delete fallback to mockStore:', err.message);
      }
    }

    if (!mockData.banners) mockData.banners = [];
    const idx = mockData.banners.findIndex(b => b.id === id || b._id === id);
    if (idx === -1) return false;
    mockData.banners.splice(idx, 1);
    return true;
  }
}

export const bannerRepository = new BannerRepository();
export default bannerRepository;
