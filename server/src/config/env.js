import dotenv from 'dotenv';

// Load environment variables from .env file if available
dotenv.config();

const DEFAULT_JWT_SECRET = 'sidd_academy_secure_jwt_secret_key_2026';
const DEFAULT_REFRESH_SECRET = 'sidd_academy_secure_refresh_secret_key_2026';

/**
 * Validate production environment secrets (SRS NFR-SEC-04 / TC-12)
 * Throws a fatal error if NODE_ENV === 'production' and JWT secrets are missing or default placeholders.
 */
export const validateProductionEnv = (envOverride = process.env) => {
  const nodeEnv = envOverride.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    const accessSecret = envOverride.JWT_ACCESS_SECRET || envOverride.JWT_SECRET;
    const refreshSecret = envOverride.JWT_REFRESH_SECRET;
    const placeholders = [
      DEFAULT_JWT_SECRET,
      DEFAULT_REFRESH_SECRET,
      'your_jwt_secret_key_change_in_production',
      'your_jwt_access_secret_key_change_in_production',
      'your_jwt_refresh_secret_key_change_in_production',
    ];

    if (!accessSecret || placeholders.includes(accessSecret) || accessSecret.length < 16) {
      throw new Error('CRITICAL SECURITY ERROR: Missing or insecure JWT_SECRET / JWT_ACCESS_SECRET in production environment.');
    }
    if (!refreshSecret || placeholders.includes(refreshSecret) || refreshSecret.length < 16) {
      throw new Error('CRITICAL SECURITY ERROR: Missing or insecure JWT_REFRESH_SECRET in production environment.');
    }
  }
  return true;
};

// Automatically validate on startup if NODE_ENV is production
if (process.env.NODE_ENV === 'production') {
  validateProductionEnv(process.env);
}

/**
 * Centralized Environment Configuration
 * Validates, provides defaults, and prevents direct process.env scattered usage
 */
export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  JWT_SECRET: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || DEFAULT_JWT_SECRET,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || DEFAULT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '7d',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  GOOGLE_DRIVE_FOLDER_ID: process.env.GOOGLE_DRIVE_FOLDER_ID || '1axziJZcQmDY1Ptbkm8s3c1ZJYStrL7Rf',
  GOOGLE_DRIVE_ACCESS_TOKEN: process.env.GOOGLE_DRIVE_ACCESS_TOKEN || '',
};

export default ENV;
