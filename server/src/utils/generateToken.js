import jwt from 'jsonwebtoken';
import ENV from '../config/env.js';

export const generateAccessToken = (userId, role) => {
  const secret = ENV.JWT_ACCESS_SECRET || ENV.JWT_SECRET;
  return jwt.sign(
    { id: userId, role },
    secret,
    { expiresIn: ENV.JWT_ACCESS_EXPIRES || '7d' }
  );
};

export const generateRefreshToken = (userId) => {
  const secret = ENV.JWT_REFRESH_SECRET;
  return jwt.sign(
    { id: userId },
    secret,
    { expiresIn: ENV.JWT_REFRESH_EXPIRES || '7d' }
  );
};

export const getRefreshCookieOptions = () => {
  const isProd = (process.env.NODE_ENV || ENV.NODE_ENV) === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  };
};

export const setRefreshTokenCookie = (res, token) => {
  try {
    res.cookie('refreshToken', token, {
      ...getRefreshCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  } catch (err) {
    console.error('Failed to set cookie', err);
  }
};

export const clearRefreshTokenCookie = (res) => {
  try {
    const opts = getRefreshCookieOptions();
    res.clearCookie('refreshToken', opts);
    res.clearCookie('token', opts);
  } catch (err) {
    console.error('Failed to clear cookie', err);
  }
};
