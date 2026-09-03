import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ENV from '../config/env.js';
import { otpRepository } from '../repositories/otp.repository.js';
import { authRepository } from '../repositories/auth.repository.js';
import { emailOtpProvider } from './emailOtp.provider.js';
import { smsOtpProvider } from './smsOtp.provider.js';
import { generateSecureOTP, hashOTP, verifyOTPHash } from '../utils/cryptoUtils.js';
import {
  isValidIndianMobile,
  normalizeIndianMobile,
  formatE164IndianMobile,
  maskEmail,
  maskPhone,
} from '../utils/phoneValidator.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';
import { sendWelcomeEmail } from '../utils/sendEmail.js';

/**
 * Production OTP Verification & Account Recovery Service
 * Modular service orchestrating OTP generation, cryptographic hashing, rate cooldowns, and credential issuance.
 */
export class OtpService {
  constructor() {
    this.otpLength = ENV.OTP_LENGTH || 6;
    this.expiryMinutes = ENV.OTP_EXPIRY_MINUTES || 5;
    this.maxAttempts = ENV.OTP_MAX_ATTEMPTS || 3;
    this.resendCooldownSeconds = ENV.OTP_RESEND_COOLDOWN_SECONDS || 60;
  }

  /**
   * Helper to evaluate resend cooldown for an identifier and purpose
   */
  async checkCooldown(identifier, purpose) {
    const latest = await otpRepository.findLatest(identifier, purpose);
    if (latest && latest.lastSentAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(latest.lastSentAt).getTime()) / 1000);
      if (elapsedSeconds < this.resendCooldownSeconds) {
        const remaining = this.resendCooldownSeconds - elapsedSeconds;
        throw new AppError(
          `Please wait ${remaining} second${remaining === 1 ? '' : 's'} before requesting a new OTP.`,
          HTTP_STATUS.TOO_MANY_REQUESTS
        );
      }
    }
  }

  /**
   * STEP 1: Registration Flow - Request Verification OTP via Indian Mobile SMS
   * Validates credentials, ensures uniqueness, pre-hashes password, and sends SMS OTP via MSG91.
   * Does NOT persist active user to database yet.
   */
  async sendRegistrationOTP({ name, email, phone, password }) {
    if (!name || !email || !password) {
      throw new AppError('Name, email, and password are required', HTTP_STATUS.BAD_REQUEST);
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // 1. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      throw new AppError('Please provide a valid email address', HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Validate Indian Mobile format (Required for mobile-first registration)
    if (!phone || !phone.trim()) {
      throw new AppError('Mobile number is required for registration verification', HTTP_STATUS.BAD_REQUEST);
    }

    if (!isValidIndianMobile(phone)) {
      throw new AppError(
        'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Internal normalization strictly to +91XXXXXXXXXX
    const normalizedPhone = formatE164IndianMobile(phone);

    // 3. Check password length
    if (password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', HTTP_STATUS.BAD_REQUEST);
    }

    // 4. Check whether email already exists in users table
    const existingEmailUser = await authRepository.findByEmail(cleanEmail);
    if (existingEmailUser) {
      throw new AppError(
        'An account with this email address already exists. Please login.',
        HTTP_STATUS.CONFLICT
      );
    }

    // 5. Check whether mobile number already exists in users table
    const existingPhoneUser = await authRepository.findByPhone(normalizedPhone);
    if (existingPhoneUser) {
      throw new AppError(
        'This mobile number is already registered.',
        HTTP_STATUS.CONFLICT
      );
    }

    // 6. Enforce resend cooldown on normalized mobile number
    await this.checkCooldown(normalizedPhone, 'registration');

    // 7. Generate cryptographically secure 6-digit OTP
    const plainOtp = generateSecureOTP(this.otpLength);
    const otpHash = hashOTP(plainOtp);

    // 8. Hash password using bcrypt before storing in metadata
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

    // 9. Invalidate prior active registration attempts for this mobile number
    await otpRepository.invalidateExisting(normalizedPhone, 'registration');

    // 10. Persist OTP record in PostgreSQL with temporary metadata (channel = 'sms')
    await otpRepository.create({
      identifier: normalizedPhone,
      purpose: 'registration',
      channel: 'sms',
      otpHash,
      metadata: {
        name: cleanName,
        email: cleanEmail,
        phone: normalizedPhone,
        passwordHash: hashedPassword,
      },
      expiresAt,
      maxAttempts: this.maxAttempts,
    });

    // 11. Dispatch OTP ONLY through configured SMS provider (MSG91)
    // DO NOT send this OTP through Resend/email
    const smsRes = await smsOtpProvider.sendOtp({
      phone: normalizedPhone,
      otp: plainOtp,
      expiryMinutes: this.expiryMinutes,
    });

    if (!smsRes.success) {
      throw new AppError(
        smsRes.error || 'Unable to deliver verification code to your mobile number. Please try again.',
        HTTP_STATUS.BAD_GATEWAY
      );
    }

    return {
      requireOtp: true,
      identifier: normalizedPhone,
      channel: 'sms',
      maskedPhone: maskPhone(normalizedPhone),
      maskedEmail: maskEmail(cleanEmail),
      cooldownSeconds: this.resendCooldownSeconds,
      expiresInMinutes: this.expiryMinutes,
      simulated: Boolean(smsRes.simulated),
    };
  }

  /**
   * STEP 2: Registration Flow - Verify OTP & Create User Account
   * Verifies hashed OTP, verifies attempt limits, creates active user with phone_verified = true, and issues JWTs.
   */
  async verifyRegistrationOTP({ identifier, otp }) {
    if (!identifier || !otp) {
      throw new AppError('Identifier and OTP are required', HTTP_STATUS.BAD_REQUEST);
    }

    // Normalize identifier: if Indian phone number, normalize to +91XXXXXXXXXX
    const cleanIdentifier = isValidIndianMobile(identifier)
      ? formatE164IndianMobile(identifier)
      : identifier.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // 1. Fetch active OTP record (try exact identifier, or fallback to E164 format)
    let record = await otpRepository.findLatestActive(cleanIdentifier, 'registration');
    if (!record && isValidIndianMobile(identifier)) {
      const altKey = formatE164IndianMobile(identifier);
      record = await otpRepository.findLatestActive(altKey, 'registration');
    }

    if (!record) {
      // Check if expired or attempt-exhausted to give clear feedback
      const latest = await otpRepository.findLatest(cleanIdentifier, 'registration');
      if (latest) {
        if (latest.attempts >= latest.maxAttempts) {
          throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', HTTP_STATUS.BAD_REQUEST);
        }
        if (new Date() > new Date(latest.expiresAt)) {
          throw new AppError('OTP has expired. Please request a new OTP.', HTTP_STATUS.BAD_REQUEST);
        }
      }
      throw new AppError('Invalid or expired verification session. Please request a new OTP.', HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Check if attempts exceeded
    if (record.attempts >= record.maxAttempts) {
      throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', HTTP_STATUS.BAD_REQUEST);
    }

    // 3. Constant-time timing-safe hash verification
    const isMatch = verifyOTPHash(cleanOtp, record.otpHash);
    if (!isMatch) {
      const updated = await otpRepository.incrementAttempts(record.id);
      const attemptsUsed = updated ? updated.attempts : record.attempts + 1;
      const remaining = Math.max(0, record.maxAttempts - attemptsUsed);

      if (remaining <= 0) {
        throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', HTTP_STATUS.BAD_REQUEST);
      }
      throw new AppError(`Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, HTTP_STATUS.BAD_REQUEST);
    }

    // 4. Mark OTP as verified immediately to prevent replay / reuse
    await otpRepository.markVerified(record.id);

    // 5. Extract pending registration payload from metadata
    const metadata = record.metadata || {};
    if (!metadata.name || !metadata.email || !metadata.passwordHash) {
      throw new AppError('Registration data expired or invalid. Please register again.', HTTP_STATUS.BAD_REQUEST);
    }

    // 6. Concurrency checks: Ensure neither email nor phone was registered in the interim
    const conflictEmail = await authRepository.findByEmail(metadata.email);
    if (conflictEmail) {
      throw new AppError('An account with this email address already exists. Please login.', HTTP_STATUS.CONFLICT);
    }

    if (metadata.phone) {
      const conflictPhone = await authRepository.findByPhone(metadata.phone);
      if (conflictPhone) {
        throw new AppError('This mobile number is already registered.', HTTP_STATUS.CONFLICT);
      }
    }

    // 7. Persist and activate user account in PostgreSQL
    // Mobile verified is strictly true when verified through SMS OTP channel
    const createdUser = await authRepository.create({
      name: metadata.name,
      email: metadata.email,
      password: metadata.passwordHash,
      phone: metadata.phone || '',
      role: 'student',
      email_verified: record.channel === 'email',
      phone_verified: true,
    });

    const userId = createdUser.id || createdUser._id;
    const role = (createdUser.role || 'student').toLowerCase();

    // 8. Issue standard JWT access & refresh tokens
    const token = generateAccessToken(userId, role);
    const refreshToken = generateRefreshToken(userId);

    // 9. Send welcome email in background
    sendWelcomeEmail(createdUser.email, createdUser.name).catch(() => {});

    return {
      user: {
        id: userId,
        _id: userId,
        name: createdUser.name,
        email: createdUser.email,
        role: role === 'user' ? 'student' : role,
        phone: createdUser.phone || '',
        avatar: createdUser.avatar || '',
        emailVerified: Boolean(createdUser.email_verified),
        phoneVerified: true,
      },
      token,
      refreshToken,
    };
  }

  /**
   * FORGOT PASSWORD: Step 1 - Request Password Reset OTP
   * Enumeration-Safe: Always returns identical success message whether account exists or not.
   */
  async sendForgotPasswordOTP({ identifier }) {
    if (!identifier) {
      throw new AppError('Please provide your registered email or mobile number', HTTP_STATUS.BAD_REQUEST);
    }

    const cleanIdentifier = identifier.trim();
    const isEmail = cleanIdentifier.includes('@');

    // Validate format
    if (isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanIdentifier)) {
        throw new AppError('Please provide a valid email address', HTTP_STATUS.BAD_REQUEST);
      }
    } else {
      if (!isValidIndianMobile(cleanIdentifier)) {
        throw new AppError('Please enter a valid 10-digit Indian mobile number', HTTP_STATUS.BAD_REQUEST);
      }
    }

    const lookupKey = isEmail ? cleanIdentifier.toLowerCase() : formatE164IndianMobile(cleanIdentifier);
    const user = isEmail
      ? await authRepository.findByEmail(lookupKey)
      : await authRepository.findByPhone(lookupKey);

    // SECURITY: Account Enumeration Protection
    // If account does NOT exist, return success immediately without throwing or leaking existence
    if (!user) {
      return {
        success: true,
        message: 'If an account matches our records, a verification code has been dispatched.',
        identifier: lookupKey,
        channel: isEmail ? 'email' : 'sms',
        maskedIdentifier: isEmail ? maskEmail(cleanIdentifier) : maskPhone(lookupKey),
        cooldownSeconds: this.resendCooldownSeconds,
      };
    }

    const userId = user.id || user._id;

    // Check resend cooldown
    await this.checkCooldown(lookupKey, 'password_reset');

    // Generate secure 6-digit OTP
    const plainOtp = generateSecureOTP(this.otpLength);
    const otpHash = hashOTP(plainOtp);
    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

    // Invalidate existing active reset attempts for this user/identifier
    await otpRepository.invalidateExisting(lookupKey, 'password_reset');

    // Store hashed OTP in PostgreSQL
    await otpRepository.create({
      userId,
      identifier: lookupKey,
      purpose: 'password_reset',
      channel: isEmail ? 'email' : 'sms',
      otpHash,
      metadata: { userId, identifier: lookupKey },
      expiresAt,
      maxAttempts: this.maxAttempts,
    });

    // Dispatch OTP through appropriate provider
    if (isEmail) {
      await emailOtpProvider.sendOtp({
        email: user.email,
        otp: plainOtp,
        subject: 'Sidd Academy - Password Reset Code',
        expiryMinutes: this.expiryMinutes,
      });
    } else {
      // Dispatches strictly through MSG91 SMS Provider (never email)
      await smsOtpProvider.sendOtp({
        phone: lookupKey,
        otp: plainOtp,
        expiryMinutes: this.expiryMinutes,
      });
    }

    return {
      success: true,
      message: 'If an account matches our records, a verification code has been dispatched.',
      identifier: lookupKey,
      channel: isEmail ? 'email' : 'sms',
      maskedIdentifier: isEmail ? maskEmail(user.email) : maskPhone(lookupKey),
      cooldownSeconds: this.resendCooldownSeconds,
    };
  }

  /**
   * FORGOT PASSWORD: Step 2 - Verify Password Reset OTP
   * Validates OTP and issues a short-lived reset authorization token.
   */
  async verifyResetPasswordOTP({ identifier, otp }) {
    if (!identifier || !otp) {
      throw new AppError('Identifier and OTP are required', HTTP_STATUS.BAD_REQUEST);
    }

    const cleanIdentifier = isValidIndianMobile(identifier)
      ? formatE164IndianMobile(identifier)
      : identifier.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    let record = await otpRepository.findLatestActive(cleanIdentifier, 'password_reset');
    if (!record && isValidIndianMobile(identifier)) {
      const altKey = normalizeIndianMobile(identifier);
      record = await otpRepository.findLatestActive(altKey, 'password_reset');
    }

    if (!record) {
      const latest = await otpRepository.findLatest(cleanIdentifier, 'password_reset');
      if (latest) {
        if (latest.attempts >= latest.maxAttempts) {
          throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', HTTP_STATUS.BAD_REQUEST);
        }
        if (new Date() > new Date(latest.expiresAt)) {
          throw new AppError('OTP has expired. Please request a new OTP.', HTTP_STATUS.BAD_REQUEST);
        }
      }
      throw new AppError('Invalid or expired OTP. Please request a new code.', HTTP_STATUS.BAD_REQUEST);
    }

    if (record.attempts >= record.maxAttempts) {
      throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', HTTP_STATUS.BAD_REQUEST);
    }

    const isMatch = verifyOTPHash(cleanOtp, record.otpHash);
    if (!isMatch) {
      const updated = await otpRepository.incrementAttempts(record.id);
      const attemptsUsed = updated ? updated.attempts : record.attempts + 1;
      const remaining = Math.max(0, record.maxAttempts - attemptsUsed);

      if (remaining <= 0) {
        throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', HTTP_STATUS.BAD_REQUEST);
      }
      throw new AppError(`Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`, HTTP_STATUS.BAD_REQUEST);
    }

    // Mark OTP as verified to prevent reuse
    await otpRepository.markVerified(record.id);

    // Issue short-lived resetToken (15 minutes)
    const resetToken = jwt.sign(
      {
        userId: record.userId,
        identifier: cleanIdentifier,
        purpose: 'password_reset_authorized',
      },
      ENV.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return {
      success: true,
      message: 'OTP verified successfully. You may now create your new password.',
      resetToken,
    };
  }

  /**
   * FORGOT PASSWORD: Step 3 - Reset Password
   * Verifies reset token, hashes password using existing bcrypt standard, and invalidates old sessions.
   */
  async resetPassword({ resetToken, newPassword }) {
    if (!resetToken || !newPassword) {
      throw new AppError('Reset token and new password are required', HTTP_STATUS.BAD_REQUEST);
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', HTTP_STATUS.BAD_REQUEST);
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, ENV.JWT_SECRET);
    } catch (err) {
      throw new AppError('Reset token has expired or is invalid. Please request a new OTP.', HTTP_STATUS.UNAUTHORIZED);
    }

    if (decoded.purpose !== 'password_reset_authorized' || !decoded.userId) {
      throw new AppError('Invalid reset authorization token', HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await authRepository.findById(decoded.userId);
    if (!user) {
      throw new AppError('Account not found', HTTP_STATUS.NOT_FOUND);
    }

    // Hash new password using project bcrypt standard (10 rounds)
    const salt = await bcrypt.genSalt(10);
    const newHashed = await bcrypt.hash(newPassword, salt);

    await authRepository.updatePassword(decoded.userId, newHashed);

    return {
      success: true,
      message: 'Password reset successfully. Please login with your new credentials.',
    };
  }

  /**
   * RESEND OTP: Generic Resend Handler
   * Resends OTP for registration, password_reset, or mobile_verification respecting cooldowns.
   */
  async resendOTP({ identifier, purpose = 'registration' }) {
    if (!identifier) {
      throw new AppError('Identifier is required to resend OTP', HTTP_STATUS.BAD_REQUEST);
    }

    const isMobile = isValidIndianMobile(identifier);
    const cleanIdentifier = isMobile
      ? formatE164IndianMobile(identifier)
      : identifier.trim().toLowerCase();

    // Check cooldown
    await this.checkCooldown(cleanIdentifier, purpose);

    // If registration: retrieve metadata from previous record
    if (purpose === 'registration') {
      let latest = await otpRepository.findLatest(cleanIdentifier, 'registration');
      if (!latest && isMobile) {
        latest = await otpRepository.findLatest(normalizeIndianMobile(identifier), 'registration');
      }

      if (!latest || !latest.metadata) {
        throw new AppError('No pending registration found for this identifier. Please register again.', HTTP_STATUS.NOT_FOUND);
      }

      const plainOtp = generateSecureOTP(this.otpLength);
      const otpHash = hashOTP(plainOtp);
      const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

      await otpRepository.invalidateExisting(cleanIdentifier, 'registration');

      const isSmsChannel = latest.channel === 'sms' || isMobile;

      await otpRepository.create({
        identifier: cleanIdentifier,
        purpose: 'registration',
        channel: isSmsChannel ? 'sms' : 'email',
        otpHash,
        metadata: latest.metadata,
        expiresAt,
        maxAttempts: this.maxAttempts,
      });

      if (isSmsChannel) {
        // Send strictly via MSG91 (do NOT send email)
        const smsRes = await smsOtpProvider.sendOtp({
          phone: cleanIdentifier,
          otp: plainOtp,
          expiryMinutes: this.expiryMinutes,
        });
        if (!smsRes.success) {
          throw new AppError(smsRes.error || 'Failed to resend SMS code', HTTP_STATUS.BAD_GATEWAY);
        }
      } else {
        await emailOtpProvider.sendOtp({
          email: cleanIdentifier,
          otp: plainOtp,
          expiryMinutes: this.expiryMinutes,
        });
      }

      return {
        success: true,
        message: isSmsChannel
          ? 'A new verification code has been dispatched to your mobile number.'
          : 'A new verification code has been dispatched to your email.',
        identifier: cleanIdentifier,
        channel: isSmsChannel ? 'sms' : 'email',
        cooldownSeconds: this.resendCooldownSeconds,
      };
    }

    if (purpose === 'password_reset') {
      return this.sendForgotPasswordOTP({ identifier: cleanIdentifier });
    }

    throw new AppError(`Unsupported OTP purpose: ${purpose}`, HTTP_STATUS.BAD_REQUEST);
  }

  /**
   * MOBILE VERIFICATION: Step 1 - Send Mobile Verification OTP
   */
  async sendMobileVerificationOTP({ userId, phone }) {
    if (!phone) {
      throw new AppError('Mobile number is required', HTTP_STATUS.BAD_REQUEST);
    }
    if (!isValidIndianMobile(phone)) {
      throw new AppError('Please enter a valid 10-digit Indian mobile number', HTTP_STATUS.BAD_REQUEST);
    }

    const normalizedPhone = normalizeIndianMobile(phone);

    // Check whether mobile number is already in use by another account
    const existing = await authRepository.findByPhone(normalizedPhone);
    if (existing && (existing.id || existing._id) !== userId) {
      throw new AppError('This mobile number is already linked to another account', HTTP_STATUS.CONFLICT);
    }

    await this.checkCooldown(normalizedPhone, 'mobile_verification');

    const plainOtp = generateSecureOTP(this.otpLength);
    const otpHash = hashOTP(plainOtp);
    const expiresAt = new Date(Date.now() + this.expiryMinutes * 60 * 1000);

    await otpRepository.invalidateExisting(normalizedPhone, 'mobile_verification');

    await otpRepository.create({
      userId,
      identifier: normalizedPhone,
      purpose: 'mobile_verification',
      channel: 'sms',
      otpHash,
      metadata: { userId, phone: formatE164IndianMobile(normalizedPhone) },
      expiresAt,
      maxAttempts: this.maxAttempts,
    });

    await smsOtpProvider.sendOtp({
      phone: normalizedPhone,
      otp: plainOtp,
      expiryMinutes: this.expiryMinutes,
    });

    return {
      success: true,
      message: 'Verification code sent to your mobile number.',
      phone: formatE164IndianMobile(normalizedPhone),
      maskedPhone: maskPhone(normalizedPhone),
      cooldownSeconds: this.resendCooldownSeconds,
    };
  }

  /**
   * MOBILE VERIFICATION: Step 2 - Verify Mobile OTP
   */
  async verifyMobileVerificationOTP({ userId, phone, otp }) {
    if (!phone || !otp) {
      throw new AppError('Phone and OTP are required', HTTP_STATUS.BAD_REQUEST);
    }

    const normalizedPhone = normalizeIndianMobile(phone);
    if (!normalizedPhone) {
      throw new AppError('Invalid phone number format', HTTP_STATUS.BAD_REQUEST);
    }

    const cleanOtp = String(otp).trim();
    const record = await otpRepository.findLatestActive(normalizedPhone, 'mobile_verification');
    if (!record) {
      throw new AppError('Invalid or expired OTP. Please request a new code.', HTTP_STATUS.BAD_REQUEST);
    }

    const isMatch = verifyOTPHash(cleanOtp, record.otpHash);
    if (!isMatch) {
      const updated = await otpRepository.incrementAttempts(record.id);
      const attemptsUsed = updated ? updated.attempts : record.attempts + 1;
      const remaining = Math.max(0, record.maxAttempts - attemptsUsed);

      if (remaining <= 0) {
        throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', HTTP_STATUS.BAD_REQUEST);
      }
      throw new AppError(`Invalid OTP. ${remaining} attempt(s) remaining.`, HTTP_STATUS.BAD_REQUEST);
    }

    await otpRepository.markVerified(record.id);

    // Update phone & phone_verified on user record
    const formattedPhone = formatE164IndianMobile(normalizedPhone);
    await authRepository.updateProfile(userId, { phone: formattedPhone });
    await authRepository.updatePhoneVerified(userId, true);

    return {
      success: true,
      message: 'Mobile number verified successfully.',
      phone: formattedPhone,
    };
  }
}

export const otpService = new OtpService();
export default otpService;
