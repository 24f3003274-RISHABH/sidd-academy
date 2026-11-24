import { body, param } from 'express-validator';

export const createSubjectValidator = [
  body('course')
    .optional({ checkFalsy: true })
    .notEmpty()
    .withMessage('Parent Course ID is required'),
  body('courseId')
    .optional({ checkFalsy: true })
    .notEmpty()
    .withMessage('Parent Course ID is required'),
  body()
    .custom((val, { req }) => {
      const raw = (req.body?.name || req.body?.title || '').trim();
      if (raw.length < 2 || raw.length > 200) {
        throw new Error('Subject name is required and must be between 2 and 200 characters');
      }
      return true;
    }),
  body('order')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
];

export const updateSubjectValidator = [
  param('id')
    .notEmpty()
    .withMessage('Subject ID is required'),
  body('name')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 200 }),
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 200 }),
  body('order')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 }),
];
