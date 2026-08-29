import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validate.middleware.js';

export const validateCreateVideo = [
  body('title')
    .trim()
    .notEmpty().withMessage('Video title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('videoUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Video URL must be a valid URL format'),

  body('playlistUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Playlist URL must be a valid URL format'),

  body('lessonId')
    .optional({ nullable: true }),

  body('durationSeconds')
    .optional()
    .isInt({ min: 0 }).withMessage('Duration must be a positive integer in seconds'),

  body('videoProvider')
    .optional()
    .isIn(['youtube', 'vimeo', 's3', 'local', 'custom'])
    .withMessage('Video provider must be youtube, vimeo, s3, local, or custom'),

  validateRequest,
];

export const validateUpdateVideo = [
  param('id')
    .trim()
    .notEmpty().withMessage('Video ID is required'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('videoUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Video URL must be a valid URL format'),

  body('playlistUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL().withMessage('Playlist URL must be a valid URL format'),

  validateRequest,
];
