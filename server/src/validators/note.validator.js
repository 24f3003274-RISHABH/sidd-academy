import { body, query, param } from 'express-validator';
import { validateRequest } from '../middleware/validate.middleware.js';

export const validateCreateNote = [
  body('title')
    .trim()
    .notEmpty().withMessage('Note title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),

  body('isFree')
    .optional()
    .isBoolean().withMessage('isFree must be a boolean value'),

  body('courseId')
    .optional({ nullable: true }),

  body('subjectId')
    .optional({ nullable: true }),

  body('chapterId')
    .optional({ nullable: true }),

  body('pageCount')
    .optional()
    .isInt({ min: 1 }).withMessage('Page count must be at least 1'),

  validateRequest,
];

export const validateUpdateNote = [
  param('id')
    .trim()
    .notEmpty().withMessage('Note ID is required'),

  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),

  body('isFree')
    .optional()
    .isBoolean().withMessage('isFree must be a boolean value'),

  validateRequest,
];

export const validateNoteQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

  validateRequest,
];
