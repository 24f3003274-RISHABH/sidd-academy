import jwt from 'jsonwebtoken';
import ENV from '../config/env.js';

export const generateAccessToken = (userId, role) => {
  const secret = ENV.JWT_ACCESS_SECRET || ENV.JWT_SECRET || 'sidd_academy_access_secret_2024_secure_key';
  return jwt.sign(
    { id: userId, role },
    secret,
    { expiresIn: ENV.JWT_ACCESS_EXPIRES || '15m' }
  );
};

export const generateRefreshToken = (userId) => {
  const secret = ENV.JWT_REFRESH_SECRET || ENV.JWT_SECRET || 'sidd_academy_refresh_secret_2024_secure_key';
  return jwt.sign(
    { id: userId },
    secret,
    { expiresIn: ENV.JWT_REFRESH_EXPIRES || '7d' }
  );
};

export const setRefreshTokenCookie = (res, token) => {
  try {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  } catch (err) {
    console.error('Failed to set cookie', err);
  }
};

