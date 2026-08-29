import { BaseRepository } from './base.repository.js';
import { query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * User Repository handles all SQL persistence operations for the users table
 */
export class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    const cleanEmail = email.toLowerCase().trim();
    if (ENV.DATABASE_URL) {
      try {
        const sql = `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`;
        const res = await query(sql, [cleanEmail]);
        return res.rows[0] || null;
      } catch (err) {
        console.warn('PostgreSQL fallback to memory store for findByEmail:', err.message);
      }
    }
    return mockData.users.find(u => u.email.toLowerCase() === cleanEmail) || null;
  }

  async findById(id) {
    if (ENV.DATABASE_URL) {
      try {
        const sql = `SELECT id, name, email, role, phone, avatar, is_active, last_login, created_at, updated_at FROM users WHERE id = $1 LIMIT 1`;
        const res = await query(sql, [id]);
        return res.rows[0] || null;
      } catch (err) {
        console.warn('PostgreSQL fallback to memory store for findById:', err.message);
      }
    }
    const user = mockData.users.find(u => u._id === id || u.id === id);
    if (!user) return null;
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async create(userData) {
    const { name, email, password, phone = '', role = 'student', avatar = '' } = userData;
    const cleanEmail = email.toLowerCase().trim();
    const id = `user_${Date.now()}`;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          INSERT INTO users (id, name, email, password, phone, role, avatar, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW())
          RETURNING id, name, email, phone, role, avatar, is_active, created_at, updated_at
        `;
        const res = await query(sql, [id, name, cleanEmail, password, phone, role, avatar]);
        return res.rows[0];
      } catch (err) {
        console.warn('PostgreSQL fallback to memory store for create user:', err.message);
      }
    }

    const newUser = {
      _id: id,
      id: id,
      name,
      email: cleanEmail,
      password,
      phone,
      role,
      avatar,
      isActive: true,
      purchasedCourses: [],
      purchasedNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockData.users.push(newUser);
    return newUser;
  }

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

export const userRepository = new UserRepository();
export default userRepository;
