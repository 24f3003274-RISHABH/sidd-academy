import { body, param } from 'express-validator';

export const createSubjectValidator = [
  body('course')
    .optional()
    .notEmpty()
    .withMessage('Parent Course ID is required'),
  body('courseId')
    .optional()
    .notEmpty()
    .withMessage('Parent Course ID is required'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Subject name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('Subject name must be between 2 and 200 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
];

export const updateSubjectValidator = [
  param('id')
    .notEmpty()
    .withMessage('Subject ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 }),
  body('order')
    .optional()
    .isInt({ min: 0 }),
];
