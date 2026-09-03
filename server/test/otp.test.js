import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { otpService } from '../src/services/otp.service.js';
import { otpRepository } from '../src/repositories/otp.repository.js';
import { authRepository } from '../src/repositories/auth.repository.js';
import { mockData } from '../src/data/mockStore.js';
import { isValidIndianMobile, normalizeIndianMobile, maskEmail, maskPhone } from '../src/utils/phoneValidator.js';
import { generateSecureOTP, hashOTP, verifyOTPHash } from '../src/utils/cryptoUtils.js';
import { emailOtpProvider } from '../src/services/emailOtp.provider.js';
import { smsOtpProvider } from '../src/services/smsOtp.provider.js';
import { query } from '../src/config/db.js';

describe('OTP Verification System Comprehensive Suite', () => {
  beforeEach(async () => {
    // Reset stores before each test for isolated testing
    otpRepository.clearMockStore();
    // Clear test mock users while keeping admin
    mockData.users = mockData.users.filter((u) => u.email === 'admin@siddacademy.com');
    try {
      await query("DELETE FROM otp_verifications WHERE identifier LIKE '%@example.com' OR identifier LIKE '%98765%' OR identifier LIKE '%998877%' OR identifier LIKE '%981234%'");
      await query("DELETE FROM users WHERE email LIKE '%@example.com' OR phone LIKE '%98765%' OR phone LIKE '%998877%' OR phone LIKE '%981234%'");
    } catch (_) {}
  });

  // 1. Registration OTP generation
  test('1. Registration OTP generation: dispatches OTP and returns masked identifier without creating user', async () => {
    const result = await otpService.sendRegistrationOTP({
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      phone: '9876543210',
      password: 'password123',
    });

    assert.equal(result.requireOtp, true);
    assert.equal(result.channel, 'email');
    assert.equal(result.identifier, 'rohan.sharma@example.com');
    assert.ok(result.maskedEmail.includes('***'));
    assert.ok(result.maskedPhone.includes('******3210'));

    // Verify record stored in repository
    const record = await otpRepository.findLatestActive('rohan.sharma@example.com', 'registration');
    assert.ok(record);
    assert.ok(record.otpHash);
    // User must NOT exist in users table yet
    const userInDb = await authRepository.findByEmail('rohan.sharma@example.com');
    assert.equal(userInDb, null);
  });

  // 2. Invalid OTP
  test('2. Invalid OTP: decrements attempts and rejects incorrect code', async () => {
    await otpService.sendRegistrationOTP({
      name: 'Priya Verma',
      email: 'priya.verma@example.com',
      password: 'password123',
    });

    await assert.rejects(
      async () => {
        await otpService.verifyRegistrationOTP({
          identifier: 'priya.verma@example.com',
          otp: '000000',
        });
      },
      (err) => {
        assert.match(err.message, /Invalid OTP/);
        return true;
      }
    );

    const record = await otpRepository.findLatest('priya.verma@example.com', 'registration');
    assert.equal(record.attempts, 1);
  });

  // 3. Expired OTP
  test('3. Expired OTP: rejects expired verification codes', async () => {
    await otpService.sendRegistrationOTP({
      name: 'Amit Kumar',
      email: 'amit.kumar@example.com',
      password: 'password123',
    });

    try {
      await query("UPDATE otp_verifications SET expires_at = NOW() - INTERVAL '1 minute' WHERE LOWER(identifier) = $1", ['amit.kumar@example.com']);
    } catch (_) {}
    const latest = await otpRepository.findLatest('amit.kumar@example.com', 'registration');
    if (latest) latest.expiresAt = new Date(Date.now() - 1000);

    await assert.rejects(
      async () => {
        await otpService.verifyRegistrationOTP({
          identifier: 'amit.kumar@example.com',
          otp: '123456',
        });
      },
      (err) => {
        assert.match(err.message, /expired/i);
        return true;
      }
    );
  });

  // 4. Too many attempts
  test('4. Too many attempts: locks out after maximum failed attempts', async () => {
    await otpService.sendRegistrationOTP({
      name: 'Vikas Singh',
      email: 'vikas.singh@example.com',
      password: 'password123',
    });

    // Exhaust 5 attempts
    for (let i = 0; i < 4; i++) {
      try {
        await otpService.verifyRegistrationOTP({
          identifier: 'vikas.singh@example.com',
          otp: `11111${i}`,
        });
      } catch (e) {
        // Expected
      }
    }

    // 5th failed attempt should trigger maximum attempts exceeded
    await assert.rejects(
      async () => {
        await otpService.verifyRegistrationOTP({
          identifier: 'vikas.singh@example.com',
          otp: '999999',
        });
      },
      (err) => {
        assert.match(err.message, /Maximum verification attempts exceeded/);
        return true;
      }
    );
  });

  // 5. Resend cooldown
  test('5. Resend cooldown: blocks rapid re-requests within cooldown interval', async () => {
    await otpService.sendRegistrationOTP({
      name: 'Neha Gupta',
      email: 'neha.gupta@example.com',
      password: 'password123',
    });

    // Immediate second attempt should trigger 429 cooldown
    await assert.rejects(
      async () => {
        await otpService.sendRegistrationOTP({
          name: 'Neha Gupta',
          email: 'neha.gupta@example.com',
          password: 'password123',
        });
      },
      (err) => {
        assert.match(err.message, /Please wait/);
        return true;
      }
    );
  });

  // 6. Successful verification
  test('6. Successful verification: activates user and returns tokens', async () => {
    // Generate known OTP directly into repository for deterministic verification test
    const plainOtp = '654321';
    const otpHash = hashOTP(plainOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await otpRepository.create({
      identifier: 'ananya.roy@example.com',
      purpose: 'registration',
      channel: 'email',
      otpHash,
      metadata: {
        name: 'Ananya Roy',
        email: 'ananya.roy@example.com',
        phone: '+919876543210',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuu',
      },
      expiresAt,
    });

    const result = await otpService.verifyRegistrationOTP({
      identifier: 'ananya.roy@example.com',
      otp: plainOtp,
    });

    assert.ok(result.token);
    assert.ok(result.refreshToken);
    assert.equal(result.user.email, 'ananya.roy@example.com');
    assert.equal(result.user.emailVerified, true);
    assert.equal(result.user.phoneVerified, true);

    // Verify user is now created in store
    const createdUser = await authRepository.findByEmail('ananya.roy@example.com');
    assert.ok(createdUser);
  });

  // 7. Duplicate email
  test('7. Duplicate email: blocks registration if email already registered', async () => {
    // Pre-create existing user
    await authRepository.create({
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'hashedpassword',
    });

    await assert.rejects(
      async () => {
        await otpService.sendRegistrationOTP({
          name: 'New Person',
          email: 'existing@example.com',
          password: 'password123',
        });
      },
      (err) => {
        assert.match(err.message, /already exists/);
        return true;
      }
    );
  });

  // 8. Duplicate mobile
  test('8. Duplicate mobile: blocks registration if phone number already registered', async () => {
    await authRepository.create({
      name: 'Phone User',
      email: 'phoneuser@example.com',
      password: 'hashedpassword',
      phone: '+919812345678',
    });

    await assert.rejects(
      async () => {
        await otpService.sendRegistrationOTP({
          name: 'Another Person',
          email: 'another@example.com',
          phone: '9812345678',
          password: 'password123',
        });
      },
      (err) => {
        assert.match(err.message, /mobile number already exists/);
        return true;
      }
    );
  });

  // 9. Forgot password
  test('9. Forgot password: sends OTP for existing user', async () => {
    await authRepository.create({
      name: 'Student One',
      email: 'student1@example.com',
      password: 'hashedpassword',
      phone: '+919988776655',
    });

    const res = await otpService.sendForgotPasswordOTP({
      identifier: 'student1@example.com',
    });

    assert.equal(res.success, true);
    assert.ok(res.maskedIdentifier.includes('***'));

    const record = await otpRepository.findLatestActive('student1@example.com', 'password_reset');
    assert.ok(record);
  });

  // 10. Non-existing account enumeration protection
  test('10. Non-existing account enumeration protection: returns uniform success without creating OTP', async () => {
    const res = await otpService.sendForgotPasswordOTP({
      identifier: 'nonexistent.user@randomdomain.com',
    });

    // Returns success so attackers cannot enumerate
    assert.equal(res.success, true);
    assert.match(res.message, /If an account matches our records/);

    // Verifies NO OTP was actually generated in DB
    const record = await otpRepository.findLatestActive('nonexistent.user@randomdomain.com', 'password_reset');
    assert.equal(record, null);
  });

  // 11. Successful password reset
  test('11. Successful password reset: verifies reset OTP and updates password with resetToken', async () => {
    const testUser = await authRepository.create({
      name: 'Reset Student',
      email: 'reset.student@example.com',
      password: 'oldHashedPassword',
    });

    const plainOtp = '778899';
    const otpHash = hashOTP(plainOtp);

    await otpRepository.create({
      userId: testUser.id,
      identifier: 'reset.student@example.com',
      purpose: 'password_reset',
      channel: 'email',
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Verify OTP to obtain reset token
    const verifyRes = await otpService.verifyResetPasswordOTP({
      identifier: 'reset.student@example.com',
      otp: plainOtp,
    });
    assert.ok(verifyRes.resetToken);

    // Execute password reset
    const resetRes = await otpService.resetPassword({
      resetToken: verifyRes.resetToken,
      newPassword: 'BrandNewPassword2026',
    });
    assert.equal(resetRes.success, true);

    // Verify new password was hashed and saved
    const updatedUser = await authRepository.findByEmail('reset.student@example.com');
    assert.notEqual(updatedUser.password, 'oldHashedPassword');
  });

  // 12. OTP reuse prevention
  test('12. OTP reuse prevention: verified OTP cannot be reused', async () => {
    const plainOtp = '112233';
    const otpHash = hashOTP(plainOtp);

    await otpRepository.create({
      identifier: 'reuse.test@example.com',
      purpose: 'registration',
      channel: 'email',
      otpHash,
      metadata: {
        name: 'Reuse Test',
        email: 'reuse.test@example.com',
        passwordHash: 'somehash',
      },
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // First use: success
    await otpService.verifyRegistrationOTP({
      identifier: 'reuse.test@example.com',
      otp: plainOtp,
    });

    // Second use: must fail
    await assert.rejects(
      async () => {
        await otpService.verifyRegistrationOTP({
          identifier: 'reuse.test@example.com',
          otp: plainOtp,
        });
      },
      (err) => {
        assert.match(err.message, /already exists|Invalid or expired/);
        return true;
      }
    );
  });

  // 13. Rate limiting / Cooldown on resend
  test('13. Rate limiting / Cooldown: resend handler blocks request within cooldown', async () => {
    await otpService.sendRegistrationOTP({
      name: 'Cooldown User',
      email: 'cooldown@example.com',
      password: 'password123',
    });

    await assert.rejects(
      async () => {
        await otpService.resendOTP({
          identifier: 'cooldown@example.com',
          purpose: 'registration',
        });
      },
      (err) => {
        assert.match(err.message, /Please wait/);
        return true;
      }
    );
  });

  // 14. Invalid mobile number
  test('14. Invalid mobile number: strictly validates Indian DoT numbering plan', () => {
    // Valid numbers (10 digits starting with 6, 7, 8, 9)
    assert.equal(isValidIndianMobile('9876543210'), true);
    assert.equal(isValidIndianMobile('+919876543210'), true);
    assert.equal(isValidIndianMobile('+91 98765 43210'), true);
    assert.equal(isValidIndianMobile('08765432100'), true);
    assert.equal(isValidIndianMobile('6123456789'), true);
    assert.equal(isValidIndianMobile('7123456789'), true);

    // Invalid numbers (starting with 1-5, short, long, non-numeric)
    assert.equal(isValidIndianMobile('1234567890'), false);
    assert.equal(isValidIndianMobile('5234567890'), false);
    assert.equal(isValidIndianMobile('98765'), false);
    assert.equal(isValidIndianMobile('987654321000'), false);
    assert.equal(isValidIndianMobile('invalid_phone'), false);
    assert.equal(isValidIndianMobile(null), false);

    // Normalization
    assert.equal(normalizeIndianMobile('+91 98765 43210'), '9876543210');
    assert.equal(maskPhone('9876543210'), '+91 ******3210');
  });

  // 15. Invalid email
  test('15. Invalid email: rejects invalid email formats during OTP requests', async () => {
    await assert.rejects(
      async () => {
        await otpService.sendRegistrationOTP({
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'password123',
        });
      },
      (err) => {
        assert.match(err.message, /valid email address/);
        return true;
      }
    );

    // Masking check
    const masked = maskEmail('rahul.verma@example.com');
    assert.ok(masked.startsWith('r'));
    assert.ok(masked.endsWith('@example.com'));
    assert.ok(masked.includes('*'));
  });

  // 16. Provider failure handling
  test('16. Provider failure handling: handles provider communication failure gracefully', async () => {
    // Test Email Provider with missing/bad key handles without crashing
    const emailRes = await emailOtpProvider.sendOtp({
      email: 'test.provider@example.com',
      otp: '123456',
    });
    // In development mode with simulation or with API error, returns structured object
    assert.equal(typeof emailRes, 'object');
    assert.equal('success' in emailRes, true);

    // Test SMS Provider with invalid number returns error safely
    const smsRes = await smsOtpProvider.sendOtp({
      phone: 'invalid',
      otp: '123456',
    });
    assert.equal(smsRes.success, false);
    assert.match(smsRes.error, /Invalid Indian mobile/);
  });
});
