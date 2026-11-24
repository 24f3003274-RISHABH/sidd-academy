import { query } from '../config/db.js';
import ENV from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';

const isUuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// In-memory store for local/development runs without DATABASE_URL
const memoryMediaStore = new Map();

/**
 * Media Repository - Durable binary storage for uploaded images/thumbnails/posters
 * Persists files in PostgreSQL `media_files` table so uploads survive ephemeral container restarts (Render/Vercel).
 */
export class MediaRepository {
  async save({ filename, mimeType, buffer }) {
    const id = uuidv4();
    const safeName = String(filename || `upload-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeMime = mimeType || 'application/octet-stream';
    const sizeBytes = buffer ? buffer.length : 0;

    if (ENV.DATABASE_URL) {
      try {
        await query(
          `INSERT INTO media_files (id, filename, mime_type, size_bytes, data, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [id, safeName, safeMime, sizeBytes, buffer]
        );
        return {
          id,
          url: `/api/v1/media/${id}`,
          filename: safeName,
          mimeType: safeMime,
          sizeBytes,
        };
      } catch (err) {
        console.warn('MediaRepository save fallback to memory store:', err.message);
      }
    }

    memoryMediaStore.set(id, {
      id,
      filename: safeName,
      mimeType: safeMime,
      sizeBytes,
      data: buffer,
      createdAt: new Date(),
    });

    return {
      id,
      url: `/api/v1/media/${id}`,
      filename: safeName,
      mimeType: safeMime,
      sizeBytes,
    };
  }

  async findById(id) {
    if (!id) return null;

    if (ENV.DATABASE_URL && isUuid(id)) {
      try {
        const res = await query(
          `SELECT id, filename, mime_type, size_bytes, data, created_at FROM media_files WHERE id = $1 LIMIT 1`,
          [id]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            id: row.id,
            filename: row.filename,
            mimeType: row.mime_type,
            sizeBytes: row.size_bytes,
            data: row.data,
            createdAt: row.created_at,
          };
        }
      } catch (err) {
        console.warn('MediaRepository findById fallback:', err.message);
      }
    }

    return memoryMediaStore.get(id) || null;
  }
}

export const mediaRepository = new MediaRepository();
export default mediaRepository;
