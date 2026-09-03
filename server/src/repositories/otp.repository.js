import { query } from '../config/db.js';
import ENV from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

// In-memory fallback store for offline development and fast unit testing
const mockOtpStore = [];

/**
 * OTP Verification Repository
 * Data Access Layer for OTP records in PostgreSQL `otp_verifications` table with in-memory fallback.
 */
export class OtpRepository {
  /**
   * Normalize an OTP verification row
   */
  normalizeRecord(row) {
    if (!row) return null;
    return {
      id: row.id,
      userId: row.user_id || row.userId || null,
      identifier: row.identifier,
      purpose: row.purpose,
      channel: row.channel,
      otpHash: row.otp_hash || row.otpHash,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {}),
      expiresAt: new Date(row.expires_at || row.expiresAt),
      attempts: parseInt(row.attempts !== undefined ? row.attempts : 0, 10),
      maxAttempts: parseInt(row.max_attempts || row.maxAttempts || 5, 10),
      lastSentAt: new Date(row.last_sent_at || row.lastSentAt || Date.now()),
      verifiedAt: row.verified_at || row.verifiedAt ? new Date(row.verified_at || row.verifiedAt) : null,
      createdAt: new Date(row.created_at || row.createdAt || Date.now()),
      updatedAt: new Date(row.updated_at || row.updatedAt || Date.now()),
    };
  }

  /**
   * Persist a new OTP verification entry
   */
  async create({
    userId = null,
    identifier,
    purpose,
    channel,
    otpHash,
    metadata = {},
    expiresAt,
    maxAttempts = 5,
  }) {
    const id = uuidv4();
    const cleanIdentifier = identifier.trim().toLowerCase();
    const now = new Date();

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          INSERT INTO otp_verifications (
            id, user_id, identifier, purpose, channel, otp_hash, metadata, expires_at, attempts, max_attempts, last_sent_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11, $12)
          RETURNING *
        `;
        const res = await query(sql, [
          id,
          userId,
          cleanIdentifier,
          purpose,
          channel,
          otpHash,
          JSON.stringify(metadata),
          expiresAt,
          maxAttempts,
          now,
          now,
          now,
        ]);
        if (res.rows.length > 0) {
          return this.normalizeRecord(res.rows[0]);
        }
      } catch (err) {
        console.warn('OtpRepository.create fallback to in-memory store:', err.message);
      }
    }

    const memoryRecord = {
      id,
      user_id: userId,
      identifier: cleanIdentifier,
      purpose,
      channel,
      otp_hash: otpHash,
      metadata,
      expires_at: expiresAt,
      attempts: 0,
      max_attempts: maxAttempts,
      last_sent_at: now,
      verified_at: null,
      created_at: now,
      updated_at: now,
    };

    mockOtpStore.push(memoryRecord);
    return this.normalizeRecord(memoryRecord);
  }

  /**
   * Find the most recent active OTP verification record for this identifier and purpose.
   * Active means: not yet verified and not expired.
   */
  async findLatestActive(identifier, purpose) {
    if (!identifier || !purpose) return null;
    const cleanIdentifier = identifier.trim().toLowerCase();

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT * FROM otp_verifications
          WHERE LOWER(identifier) = $1
            AND purpose = $2
            AND verified_at IS NULL
            AND expires_at > NOW()
          ORDER BY created_at DESC
          LIMIT 1
        `;
        const res = await query(sql, [cleanIdentifier, purpose]);
        if (res.rows.length > 0) {
          return this.normalizeRecord(res.rows[0]);
        }
      } catch (err) {
        console.warn('OtpRepository.findLatestActive fallback to in-memory store:', err.message);
      }
    }

    const now = new Date();
    const active = mockOtpStore
      .filter(
        (r) =>
          r.identifier.toLowerCase() === cleanIdentifier &&
          r.purpose === purpose &&
          !r.verified_at &&
          new Date(r.expires_at) > now
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return active.length > 0 ? this.normalizeRecord(active[0]) : null;
  }

  /**
   * Find the most recent OTP entry (regardless of expiration) to evaluate cooldowns.
   */
  async findLatest(identifier, purpose) {
    if (!identifier || !purpose) return null;
    const cleanIdentifier = identifier.trim().toLowerCase();

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          SELECT * FROM otp_verifications
          WHERE LOWER(identifier) = $1
            AND purpose = $2
          ORDER BY last_sent_at DESC
          LIMIT 1
        `;
        const res = await query(sql, [cleanIdentifier, purpose]);
        if (res.rows.length > 0) {
          return this.normalizeRecord(res.rows[0]);
        }
      } catch (err) {
        console.warn('OtpRepository.findLatest fallback to in-memory store:', err.message);
      }
    }

    const records = mockOtpStore
      .filter((r) => r.identifier.toLowerCase() === cleanIdentifier && r.purpose === purpose)
      .sort((a, b) => new Date(b.last_sent_at) - new Date(a.last_sent_at));

    return records.length > 0 ? this.normalizeRecord(records[0]) : null;
  }

  /**
   * Increment attempt counter for a specific record.
   */
  async incrementAttempts(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          UPDATE otp_verifications
          SET attempts = attempts + 1, updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `;
        const res = await query(sql, [id]);
        if (res.rows.length > 0) {
          return this.normalizeRecord(res.rows[0]);
        }
      } catch (err) {
        console.warn('OtpRepository.incrementAttempts fallback to in-memory store:', err.message);
      }
    }

    const rec = mockOtpStore.find((r) => r.id === id);
    if (rec) {
      rec.attempts = (rec.attempts || 0) + 1;
      rec.updated_at = new Date();
      return this.normalizeRecord(rec);
    }
    return null;
  }

  /**
   * Mark record as verified.
   */
  async markVerified(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          UPDATE otp_verifications
          SET verified_at = NOW(), updated_at = NOW()
          WHERE id = $1
          RETURNING *
        `;
        const res = await query(sql, [id]);
        if (res.rows.length > 0) {
          return this.normalizeRecord(res.rows[0]);
        }
      } catch (err) {
        console.warn('OtpRepository.markVerified fallback to in-memory store:', err.message);
      }
    }

    const rec = mockOtpStore.find((r) => r.id === id);
    if (rec) {
      rec.verified_at = new Date();
      rec.updated_at = new Date();
      return this.normalizeRecord(rec);
    }
    return null;
  }

  /**
   * Invalidate all existing unverified OTP entries for an identifier and purpose.
   */
  async invalidateExisting(identifier, purpose) {
    if (!identifier || !purpose) return;
    const cleanIdentifier = identifier.trim().toLowerCase();

    if (ENV.DATABASE_URL) {
      try {
        const sql = `
          UPDATE otp_verifications
          SET expires_at = NOW(), updated_at = NOW()
          WHERE LOWER(identifier) = $1
            AND purpose = $2
            AND verified_at IS NULL
            AND expires_at > NOW()
        `;
        await query(sql, [cleanIdentifier, purpose]);
      } catch (err) {
        console.warn('OtpRepository.invalidateExisting fallback to in-memory store:', err.message);
      }
    }

    const now = new Date();
    mockOtpStore.forEach((r) => {
      if (
        r.identifier.toLowerCase() === cleanIdentifier &&
        r.purpose === purpose &&
        !r.verified_at &&
        new Date(r.expires_at) > now
      ) {
        r.expires_at = now;
        r.updated_at = now;
      }
    });
  }

  /**
   * Clear in-memory mock store (useful for clean unit tests)
   */
  clearMockStore() {
    mockOtpStore.length = 0;
  }
}

export const otpRepository = new OtpRepository();
export default otpRepository;
