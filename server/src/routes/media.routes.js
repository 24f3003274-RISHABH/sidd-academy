import express from 'express';
import { mediaRepository } from '../repositories/media.repository.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { uploadImage } from '../middleware/upload.middleware.js';
import { sendSuccess, AppError } from '../utils/apiResponse.js';

const router = express.Router();

/**
 * POST /api/v1/media/upload
 * Admin endpoint to upload an image (poster, banner, course thumbnail) to durable PostgreSQL storage
 */
router.post(
  '/upload',
  authenticate,
  authorize('ADMIN'),
  uploadImage.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file || !req.file.buffer) {
        return next(new AppError('Please select an image file (JPEG, PNG, or WebP) to upload.', 400));
      }
      const saved = await mediaRepository.save({
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        buffer: req.file.buffer,
      });
      return sendSuccess(res, 201, 'Image uploaded successfully', {
        id: saved.id,
        url: saved.url,
        filename: saved.filename,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/media/:id
 * Public endpoint to serve stored images with immutable caching
 */
router.get('/:id', async (req, res, next) => {
  try {
    const file = await mediaRepository.findById(req.params.id);
    if (!file || !file.data) {
      return next(new AppError('Media file not found', 404));
    }

    const buffer = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(buffer);
  } catch (error) {
    next(error);
  }
});

export default router;
