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

  body('courseId')
    .optional({ nullable: true }),

  body('subjectId')
    .optional({ nullable: true }),

  body('chapterId')
    .optional({ nullable: true }),

  body('description')
    .optional()
    .trim(),

  body('durationSeconds')
    .optional()
    .isInt({ min: 0 }).withMessage('Duration must be a positive integer in seconds'),

  body('videoProvider')
    .optional()
    .isIn(['youtube', 'vimeo', 's3', 'local', 'custom'])
    .withMessage('Video provider must be youtube, vimeo, s3, local, or custom'),

  body('quality')
    .optional()
    .isIn(['720p', '1080p', '4K'])
    .withMessage('Quality must be 720p, 1080p, or 4K'),

  body('isPublished')
    .optional()
    .isBoolean().withMessage('isPublished must be a boolean'),

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

  body('isPublished')
    .optional()
    .isBoolean().withMessage('isPublished must be a boolean'),

  validateRequest,
];
