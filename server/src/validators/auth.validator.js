import { body } from 'express-validator';
import { isValidIndianMobile } from '../utils/phoneValidator.js';

/**
 * Validation rules for user authentication & OTP operations
 */
export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must not exceed 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .custom((value) => {
      if (!isValidIndianMobile(value)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)');
      }
      return true;
    }),
];

export const verifyRegistrationValidator = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Identifier (mobile number or email) is required')
    .custom((value) => {
      const isEmail = value.includes('@');
      if (!isEmail && !isValidIndianMobile(value)) {
        throw new Error('Please provide a valid Indian mobile number or email address');
      }
      return true;
    }),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must consist of digits only'),
];

export const forgotPasswordValidator = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Registered email or mobile number is required'),
];

export const verifyResetOtpValidator = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Registered email or mobile number is required'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must consist of digits only'),
];

export const resetPasswordValidator = [
  body('resetToken')
    .trim()
    .notEmpty()
    .withMessage('Reset authorization token is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
];

export const resendOtpValidator = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Identifier is required'),
  body('purpose')
    .optional()
    .isIn(['registration', 'password_reset', 'mobile_verification'])
    .withMessage('Invalid OTP purpose'),
];

export const sendMobileOtpValidator = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .custom((value) => {
      if (!isValidIndianMobile(value)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number');
      }
      return true;
    }),
];

export const verifyMobileOtpValidator = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required'),
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must consist of digits only'),
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

