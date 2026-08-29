import { authRepository, AuthRepository } from './auth.repository.js';
import { query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';

/**
 * User Repository
 * Data Access Layer for User Administration, Role Management, and Profiles.
 * Extends AuthRepository with administrative query capabilities.
 */
export class UserRepository extends AuthRepository {
  /**
   * Normalize user record to standardized safe DTO
   */
  normalizeUser(u) {
    if (!u) return null;
    const id = u.id || u._id;
    const isActive = u.is_active !== undefined ? Boolean(u.is_active) : (u.isActive !== undefined ? Boolean(u.isActive) : true);
    return {
      id,
      _id: id,
      name: u.name,
      email: u.email,
      role: (u.role || 'student').toLowerCase(),
      phone: u.phone || '',
      avatar: u.avatar || '',
      isActive,
      is_active: isActive,
      lastLogin: u.last_login || u.lastLogin || null,
      createdAt: u.created_at || u.createdAt || new Date(),
      updatedAt: u.updated_at || u.updatedAt || new Date(),
    };
  }

  /**
   * Find paginated users with optional search and role filtering
   */
  async findAll({ page = 1, limit = 10, search, role, excludeRole = 'admin' } = {}) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    if (ENV.DATABASE_URL) {
      try {
        const conditions = [];
        const params = [];
        let pIndex = 1;

        if (excludeRole) {
          conditions.push(`LOWER(role) != LOWER($${pIndex++})`);
          params.push(excludeRole);
        }

        if (role) {
          conditions.push(`LOWER(role) = LOWER($${pIndex++})`);
          params.push(role);
        }

        if (search && search.trim()) {
          conditions.push(`(name ILIKE $${pIndex} OR email ILIKE $${pIndex})`);
          params.push(`%${search.trim()}%`);
          pIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const countSql = `SELECT COUNT(*) FROM users ${whereClause}`;
        const countRes = await query(countSql, params);
        const total = parseInt(countRes.rows[0]?.count || 0, 10);

        const fetchParams = [...params, limitNum, offset];
        const usersSql = `
          SELECT id, name, email, role, phone, avatar, is_active, last_login, created_at, updated_at
          FROM users
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT $${pIndex++} OFFSET $${pIndex++}
        `;
        const res = await query(usersSql, fetchParams);
        const users = res.rows.map(r => this.normalizeUser(r));

        return {
          users,
          total,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
        };
      } catch (err) {
        console.warn('UserRepository findAll fallback to mockStore:', err.message);
      }
    }

    // In-memory fallback
    if (!mockData.users) mockData.users = [];
    let filtered = [...mockData.users];

    if (excludeRole) {
      filtered = filtered.filter(u => (u.role || '').toLowerCase() !== excludeRole.toLowerCase());
    }

    if (role) {
      filtered = filtered.filter(u => (u.role || '').toLowerCase() === role.toLowerCase());
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const users = filtered.slice(offset, offset + limitNum).map(u => this.normalizeUser(u));

    return {
      users,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    };
  }

  /**
   * Find sanitized user by ID
   */
  async findById(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT id, name, email, role, phone, avatar, is_active, last_login, created_at, updated_at
          FROM users
          WHERE id = $1
          LIMIT 1
        `;
        const res = await query(sql, [id]);
        if (res.rows.length > 0) {
          return this.normalizeUser(res.rows[0]);
        }
      } catch (err) {
        console.warn('UserRepository findById fallback to mockStore:', err.message);
      }
    }

    const user = (mockData.users || []).find(u => u.id === id || u._id === id);
    return user ? this.normalizeUser(user) : null;
  }

  /**
   * Update a user's role (e.g. 'student', 'admin', 'instructor')
   */
  async updateRole(id, role) {
    if (!id || !role) return null;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          UPDATE users 
          SET role = $1, updated_at = NOW() 
          WHERE id = $2 
          RETURNING id, name, email, role, phone, avatar, is_active, last_login, created_at, updated_at
        `;
        const res = await query(sql, [role.toLowerCase(), id]);
        if (res.rows.length > 0) {
          return this.normalizeUser(res.rows[0]);
        }
      } catch (err) {
        console.warn('UserRepository updateRole fallback to mockStore:', err.message);
      }
    }

    const user = (mockData.users || []).find(u => u.id === id || u._id === id);
    if (!user) return null;
    user.role = role.toLowerCase();
    user.updatedAt = new Date().toISOString();
    return this.normalizeUser(user);
  }

  /**
   * Toggle a user's active status
   */
  async toggleStatus(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          UPDATE users 
          SET is_active = NOT is_active, updated_at = NOW() 
          WHERE id = $1 
          RETURNING id, name, email, role, phone, avatar, is_active, last_login, created_at, updated_at
        `;
        const res = await query(sql, [id]);
        if (res.rows.length > 0) {
          return this.normalizeUser(res.rows[0]);
        }
      } catch (err) {
        console.warn('UserRepository toggleStatus fallback to mockStore:', err.message);
      }
    }

    const user = (mockData.users || []).find(u => u.id === id || u._id === id);
    if (!user) return null;
    user.isActive = user.isActive === false ? true : false;
    user.updatedAt = new Date().toISOString();
    return this.normalizeUser(user);
  }

  /**
   * Count users matching optional role criteria
   */
  async countUsers({ excludeRole = 'admin', role } = {}) {
    if (ENV.DATABASE_URL) {
      try {
        const conditions = [];
        const params = [];
        let pIndex = 1;

        if (excludeRole) {
          conditions.push(`LOWER(role) != LOWER($${pIndex++})`);
          params.push(excludeRole);
        }

        if (role) {
          conditions.push(`LOWER(role) = LOWER($${pIndex++})`);
          params.push(role);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const sql = `SELECT COUNT(*) FROM users ${whereClause}`;
        const res = await query(sql, params);
        return parseInt(res.rows[0]?.count || 0, 10);
      } catch (err) {
        console.warn('UserRepository countUsers fallback to mockStore:', err.message);
      }
    }

    let filtered = [...(mockData.users || [])];
    if (excludeRole) {
      filtered = filtered.filter(u => (u.role || '').toLowerCase() !== excludeRole.toLowerCase());
    }
    if (role) {
      filtered = filtered.filter(u => (u.role || '').toLowerCase() === role.toLowerCase());
    }
    return filtered.length;
  }
}

export const userRepository = new UserRepository();
export default userRepository;
