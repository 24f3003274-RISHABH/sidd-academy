import { body, param } from 'express-validator';

export const createChapterValidator = [
  body('subject')
    .optional()
    .notEmpty()
    .withMessage('Subject ID is required'),
  body('subjectId')
    .optional()
    .notEmpty()
    .withMessage('Subject ID is required'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Chapter title is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Chapter title must be between 2 and 255 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
];

export const updateChapterValidator = [
  param('id')
    .notEmpty()
    .withMessage('Chapter ID is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 }),
  body('order')
    .optional()
    .isInt({ min: 0 }),
];
