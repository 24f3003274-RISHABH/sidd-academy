import { query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * SECURITY-SENSITIVE: Auth Repository
 * Data Access Layer for User authentication, credential retrieval, profile management, and RBAC roles.
 * 
 * Interacts with PostgreSQL `users` table via parameterized queries with in-memory fallback.
 */
export class AuthRepository {
  /**
   * Find user by email including hashed password (used strictly for credential verification).
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT id, name, email, password, role, phone, avatar, is_active, email_verified, phone_verified, last_login, created_at, updated_at
          FROM users 
          WHERE LOWER(email) = LOWER($1) 
          LIMIT 1
        `;
        const res = await query(sql, [cleanEmail]);
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      } catch (err) {
        // Fallback to memory store if PostgreSQL connection fails
        console.warn('AuthRepository findByEmail fallback to mockStore:', err.message);
      }
    }

    const memoryUser = mockData.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!memoryUser) return null;

    return {
      id: memoryUser._id || memoryUser.id,
      _id: memoryUser._id || memoryUser.id,
      name: memoryUser.name,
      email: memoryUser.email,
      password: memoryUser.password,
      role: memoryUser.role,
      phone: memoryUser.phone || '',
      avatar: memoryUser.avatar || '',
      is_active: memoryUser.isActive !== false,
      email_verified: memoryUser.email_verified || memoryUser.emailVerified || false,
      phone_verified: memoryUser.phone_verified || memoryUser.phoneVerified || false,
      last_login: memoryUser.lastLogin || null,
      created_at: memoryUser.createdAt,
      updated_at: memoryUser.updatedAt,
    };
  }

  /**
   * Find user by phone number (Indian mobile format).
   * @param {string} phone
   * @returns {Promise<Object|null>}
   */
  async findByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, '');
    // Allow matching both 10-digit, +91-prefixed, or 91-prefixed
    const tenDigit = cleanPhone.slice(-10);

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT id, name, email, password, role, phone, avatar, is_active, email_verified, phone_verified, last_login, created_at, updated_at
          FROM users 
          WHERE phone LIKE $1 OR phone = $2 OR phone = $3
          LIMIT 1
        `;
        const res = await query(sql, [`%${tenDigit}`, cleanPhone, `+91${tenDigit}`]);
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      } catch (err) {
        console.warn('AuthRepository findByPhone fallback to mockStore:', err.message);
      }
    }

    const memoryUser = mockData.users.find(u => {
      if (!u.phone) return false;
      const uClean = u.phone.replace(/[\s\-\(\)]/g, '');
      return uClean.endsWith(tenDigit) || uClean === cleanPhone;
    });

    if (!memoryUser) return null;

    return {
      id: memoryUser._id || memoryUser.id,
      _id: memoryUser._id || memoryUser.id,
      name: memoryUser.name,
      email: memoryUser.email,
      password: memoryUser.password,
      role: memoryUser.role,
      phone: memoryUser.phone || '',
      avatar: memoryUser.avatar || '',
      is_active: memoryUser.isActive !== false,
      email_verified: memoryUser.email_verified || memoryUser.emailVerified || false,
      phone_verified: memoryUser.phone_verified || memoryUser.phoneVerified || false,
      last_login: memoryUser.lastLogin || null,
      created_at: memoryUser.createdAt,
      updated_at: memoryUser.updatedAt,
    };
  }

  /**
   * Find user by identifier (either email or phone number).
   * @param {string} identifier
   * @returns {Promise<Object|null>}
   */
  async findByIdentifier(identifier) {
    if (!identifier) return null;
    const trimmed = identifier.trim();
    if (trimmed.includes('@')) {
      return this.findByEmail(trimmed);
    }
    return this.findByPhone(trimmed);
  }

  /**
   * Find sanitized user by ID (excludes password).
   * @param {string} id
   * @returns {Promise<Object|null>}
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
          return res.rows[0];
        }
      } catch (err) {
        console.warn('AuthRepository findById fallback to mockStore:', err.message);
      }
    }

    const memoryUser = mockData.users.find(u => (u._id === id || u.id === id));
    if (!memoryUser) return null;

    const { password, refreshToken, ...safeUser } = memoryUser;
    return {
      id: safeUser._id || safeUser.id,
      _id: safeUser._id || safeUser.id,
      ...safeUser,
      is_active: safeUser.isActive !== false,
    };
  }

  /**
   * Find user with password hash by ID (for password change verification).
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findByIdWithPassword(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT id, name, email, password, role, phone, avatar, is_active, last_login, created_at, updated_at
          FROM users 
          WHERE id = $1 
          LIMIT 1
        `;
        const res = await query(sql, [id]);
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      } catch (err) {
        console.warn('AuthRepository findByIdWithPassword fallback to mockStore:', err.message);
      }
    }

    const memoryUser = mockData.users.find(u => (u._id === id || u.id === id));
    if (!memoryUser) return null;

    return {
      id: memoryUser._id || memoryUser.id,
      _id: memoryUser._id || memoryUser.id,
      name: memoryUser.name,
      email: memoryUser.email,
      password: memoryUser.password,
      role: memoryUser.role,
      phone: memoryUser.phone,
      avatar: memoryUser.avatar,
      is_active: memoryUser.isActive !== false,
    };
  }

  /**
   * Create a new user record with pre-hashed password.
   * @param {Object} userData
   * @returns {Promise<Object>} Safe user object
   */
  async create(userData) {
    const {
      name,
      email,
      password,
      phone = '',
      role = 'student',
      avatar = '',
      email_verified = false,
      phone_verified = false,
    } = userData;
    const cleanEmail = email.toLowerCase().trim();
    const cleanPhone = phone ? phone.trim() : '';
    const id = uuidv4();

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          INSERT INTO users (id, name, email, password, phone, role, avatar, is_active, email_verified, phone_verified, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, NOW(), NOW())
          RETURNING id, name, email, phone, role, avatar, is_active, email_verified, phone_verified, created_at, updated_at
        `;
        const res = await query(sql, [
          id,
          name.trim(),
          cleanEmail,
          password,
          cleanPhone,
          role.toLowerCase(),
          avatar,
          email_verified,
          phone_verified,
        ]);
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      } catch (err) {
        console.warn('AuthRepository create user fallback to mockStore:', err.message);
      }
    }

    const memoryId = `user_${Date.now()}`;
    const newUser = {
      _id: memoryId,
      id: memoryId,
      name: name.trim(),
      email: cleanEmail,
      password, // Already bcrypt hashed
      phone: cleanPhone,
      role: role.toLowerCase(),
      avatar,
      isActive: true,
      email_verified: email_verified,
      phone_verified: phone_verified,
      purchasedCourses: [],
      purchasedNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockData.users.push(newUser);
    const { password: _, refreshToken: __, ...safeUser } = newUser;
    return safeUser;
  }

  /**
   * Update email verification flag
   */
  async updateEmailVerified(id, status = true) {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `UPDATE users SET email_verified = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
        const res = await query(sql, [status, id]);
        if (res.rows.length > 0) return res.rows[0];
      } catch (err) {
        console.warn('AuthRepository.updateEmailVerified fallback to mockStore:', err.message);
      }
    }
    const u = mockData.users.find((x) => (x.id === id || x._id === id));
    if (u) {
      u.email_verified = status;
      u.updatedAt = new Date().toISOString();
      return u;
    }
    return null;
  }

  /**
   * Update phone verification flag
   */
  async updatePhoneVerified(id, status = true) {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `UPDATE users SET phone_verified = $1, updated_at = NOW() WHERE id = $2 RETURNING *`;
        const res = await query(sql, [status, id]);
        if (res.rows.length > 0) return res.rows[0];
      } catch (err) {
        console.warn('AuthRepository.updatePhoneVerified fallback to mockStore:', err.message);
      }
    }
    const u = mockData.users.find((x) => (x.id === id || x._id === id));
    if (u) {
      u.phone_verified = status;
      u.updatedAt = new Date().toISOString();
      return u;
    }
    return null;
  }

  /**
   * Update user profile fields (name, phone, avatar).
   */
  async updateProfile(id, { name, phone, avatar }) {
    if (ENV.DATABASE_URL) {
      try {
        const updates = [];
        const values = [id];
        let idx = 2;

        if (name !== undefined) {
          updates.push(`name = $${idx++}`);
          values.push(name.trim());
        }
        if (phone !== undefined) {
          updates.push(`phone = $${idx++}`);
          values.push(phone.trim());
        }
        if (avatar !== undefined) {
          updates.push(`avatar = $${idx++}`);
          values.push(avatar);
        }
        updates.push(`updated_at = NOW()`);

        const sql = `
          UPDATE users 
          SET ${updates.join(', ')} 
          WHERE id = $1 
          RETURNING id, name, email, phone, role, avatar, is_active, created_at, updated_at
        `;
        const res = await query(sql, values);
        if (res.rows.length > 0) {
          return res.rows[0];
        }
      } catch (err) {
        console.warn('AuthRepository updateProfile fallback to mockStore:', err.message);
      }
    }

    const user = mockData.users.find(u => u._id === id || u.id === id);
    if (!user) return null;
    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;
    user.updatedAt = new Date().toISOString();

    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Update user hashed password.
   */
  async updatePassword(id, hashedPassword) {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`;
        await query(sql, [hashedPassword, id]);
        return true;
      } catch (err) {
        console.warn('AuthRepository updatePassword fallback to mockStore:', err.message);
      }
    }

    const user = mockData.users.find(u => u._id === id || u.id === id);
    if (user) {
      user.password = hashedPassword;
      user.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Update last login timestamp.
   */
  async updateLastLogin(id) {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `UPDATE users SET last_login = NOW() WHERE id = $1`;
        await query(sql, [id]);
      } catch (err) {
        // Silently continue
      }
    }
    const user = mockData.users.find(u => u._id === id || u.id === id);
    if (user) {
      user.lastLogin = new Date().toISOString();
    }
  }
}

export const authRepository = new AuthRepository();
export default authRepository;
