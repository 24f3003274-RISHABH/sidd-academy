import { body, param, query } from 'express-validator';

export const createCourseValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Course title must be between 3 and 255 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Course description is required'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number or zero'),
  body('discountPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number or zero'),
  body('level')
    .optional()
    .isIn(['Class 9', 'Class 10', 'Class 11', 'Class 12', 'Foundation', 'Advanced', 'Beginner', 'Intermediate'])
    .withMessage('Invalid course level'),
  body('thumbnail')
    .optional()
    .isString(),
];

export const updateCourseValidator = [
  param('id')
    .notEmpty()
    .withMessage('Course ID is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Course title must be between 3 and 255 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
];

export const courseQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];
