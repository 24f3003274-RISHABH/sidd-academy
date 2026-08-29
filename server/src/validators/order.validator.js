import { body, query, param } from 'express-validator';
import { validateRequest } from '../middleware/validate.middleware.js';

export const validateCreateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Items must be an array with at least one resource item'),

  body('items.*.itemId')
    .notEmpty()
    .withMessage('Each item must have a valid itemId'),

  body('items.*.itemType')
    .optional()
    .isIn(['course', 'note', 'COURSE', 'NOTE'])
    .withMessage('itemType must be either "course" or "note"'),

  body('items.*.type')
    .optional()
    .isIn(['course', 'note', 'COURSE', 'NOTE'])
    .withMessage('type must be either "course" or "note"'),

  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Order notes cannot exceed 500 characters'),

  validateRequest,
];

export const validateVerifyPayment = [
  body('orderId')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('orderId cannot be empty if provided'),

  body('razorpayOrderId')
    .optional()
    .trim(),

  body('razorpay_order_id')
    .optional()
    .trim(),

  body('razorpayPaymentId')
    .optional()
    .trim(),

  body('razorpay_payment_id')
    .optional()
    .trim(),

  body('razorpaySignature')
    .optional()
    .trim(),

  body('razorpay_signature')
    .optional()
    .trim(),

  validateRequest,
];

export const validateOrderIdParam = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Order ID is required in URL parameter'),

  validateRequest,
];

export const validateOrderQueryParams = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isString()
    .trim(),

  query('search')
    .optional()
    .isString()
    .trim(),

  validateRequest,
];
