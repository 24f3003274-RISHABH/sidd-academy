import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'sidd_academy_access_secret_2024_secure_key';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'sidd_academy_refresh_secret_2024_secure_key';

export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
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

