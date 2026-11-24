import { body, param } from 'express-validator';

const isValidDuration = (val) => {
  if (val === undefined || val === null || val === '') return true;
  if (typeof val === 'number' && val >= 0) return true;
  const str = String(val).trim();
  if (/^\d+$/.test(str)) return Number(str) >= 0;
  if (/^\d{1,3}:\d{2}(:\d{2})?$/.test(str)) return true;
  if (/^\d+\s*(mins?|minutes?|hrs?|hours?)$/i.test(str)) return true;
  return false;
};

export const createLessonValidator = [
  body('chapter')
    .optional({ checkFalsy: true })
    .notEmpty()
    .withMessage('Chapter ID is required'),
  body('chapterId')
    .optional({ checkFalsy: true })
    .notEmpty()
    .withMessage('Chapter ID is required'),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Class / Lesson title is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Title must be between 2 and 255 characters'),
  body('classDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Class date must be a valid date format (ISO8601)'),
  body('duration')
    .optional({ checkFalsy: true })
    .custom(isValidDuration)
    .withMessage('Duration must be minutes (e.g. 45) or MM:SS format (e.g. 30:00)'),
  body('order')
    .optional({ checkFalsy: true })
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  body('classNumber')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('Class number must be a positive integer'),
  body('isFree').optional().isBoolean(),
  body('isProtected').optional().isBoolean(),
];

export const updateLessonValidator = [
  param('id')
    .notEmpty()
    .withMessage('Lesson ID is required'),
  body('title')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 255 }),
  body('classDate')
    .optional({ checkFalsy: true })
    .isISO8601(),
  body('duration')
    .optional({ checkFalsy: true })
    .custom(isValidDuration)
    .withMessage('Duration must be minutes (e.g. 45) or MM:SS format (e.g. 30:00)'),
  body('classNumber').optional({ checkFalsy: true }).isInt({ min: 1 }),
  body('isFree').optional().isBoolean(),
  body('isProtected').optional().isBoolean(),
];
