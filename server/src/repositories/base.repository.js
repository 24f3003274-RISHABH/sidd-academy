import { query } from '../config/db.js';
import { mockData } from '../data/mockStore.js';
import ENV from '../config/env.js';

/**
 * Base Repository providing clean CRUD interfaces over PostgreSQL
 */
export class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async findById(id) {
    if (ENV.DATABASE_URL) {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = $1 LIMIT 1`;
      const res = await query(sql, [id]);
      return res.rows[0] || null;
    }
    return null;
  }

  async findAll(limit = 100, offset = 0) {
    if (ENV.DATABASE_URL) {
      const sql = `SELECT * FROM ${this.tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      const res = await query(sql, [limit, offset]);
      return res.rows;
    }
    return [];
  }

  async deleteById(id) {
    if (ENV.DATABASE_URL) {
      const sql = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
      const res = await query(sql, [id]);
      return res.rows[0] || null;
    }
    return null;
  }
}

export default BaseRepository;
