import { body, param } from 'express-validator';

export const createLessonValidator = [
  body('chapter')
    .optional()
    .notEmpty()
    .withMessage('Chapter ID is required'),
  body('chapterId')
    .optional()
    .notEmpty()
    .withMessage('Chapter ID is required'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Class / Lesson title is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Title must be between 2 and 255 characters'),
  body('classDate')
    .optional()
    .isISO8601()
    .withMessage('Class date must be a valid date format (ISO8601)'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration in minutes must be a positive integer'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
];

export const updateLessonValidator = [
  param('id')
    .notEmpty()
    .withMessage('Lesson ID is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 }),
  body('classDate')
    .optional()
    .isISO8601(),
  body('duration')
    .optional()
    .isInt({ min: 0 }),
];
