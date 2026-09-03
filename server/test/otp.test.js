import { test, describe, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { otpService } from '../src/services/otp.service.js';
import { otpRepository } from '../src/repositories/otp.repository.js';
import { authRepository } from '../src/repositories/auth.repository.js';
import { mockData } from '../src/data/mockStore.js';
import { isValidIndianMobile, normalizeIndianMobile, formatE164IndianMobile, maskEmail, maskPhone } from '../src/utils/phoneValidator.js';
import { generateSecureOTP, hashOTP, verifyOTPHash } from '../src/utils/cryptoUtils.js';
import { emailOtpProvider } from '../src/services/emailOtp.provider.js';
import { smsOtpProvider } from '../src/services/smsOtp.provider.js';
import { getPool, query } from '../src/config/db.js';

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

  after(async () => {
    try {
      const p = getPool();
      if (p) {
        await p.end();
      }
    } catch (_) {}
  });

  // 1. Mobile Registration OTP generation
  test('1. Mobile Registration OTP generation: dispatches SMS OTP via MSG91 and returns masked phone without creating user', async () => {
    const result = await otpService.sendRegistrationOTP({
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      phone: '9876543210',
      password: 'password123',
    });

    assert.equal(result.requireOtp, true);
    assert.equal(result.channel, 'sms');
    assert.equal(result.identifier, '+919876543210');
    assert.ok(result.maskedPhone.includes('******3210'));

    // Verify record stored in repository under normalized phone
    const record = await otpRepository.findLatestActive('+919876543210', 'registration');
    assert.ok(record);
    assert.ok(record.otpHash);
    assert.equal(record.channel, 'sms');
    // User must NOT exist in users table yet
    const userInDb = await authRepository.findByEmail('rohan.sharma@example.com');
    assert.equal(userInDb, null);
  });

  // 2. Invalid OTP
  test('2. Invalid OTP: decrements attempts and rejects incorrect code', async () => {
    await otpService.sendRegistrationOTP({
      name: 'Priya Verma',
      email: 'priya.verma@example.com',
      phone: '9876543211',
      password: 'password123',
    });

    await assert.rejects(
      async () => {
        await otpService.verifyRegistrationOTP({
          identifier: '+919876543211',
          otp: '000000',
        });
      },
      (err) => {
        assert.match(err.message, /Invalid OTP/);
        return true;
      }
    );

    const record = await otpRepository.findLatest('+919876543211', 'registration');
    assert.equal(record.attempts, 1);
  });

  // 3. Expired OTP
  test('3. Expired OTP: rejects expired verification codes', async () => {
    await otpService.sendRegistrationOTP({
      name: 'Amit Kumar',
      email: 'amit.kumar@example.com',
      phone: '9876543212',
      password: 'password123',
    });

    try {
      await query("UPDATE otp_verifications SET expires_at = NOW() - INTERVAL '1 minute' WHERE identifier = $1", ['+919876543212']);
    } catch (_) {}
    const latest = await otpRepository.findLatest('+919876543212', 'registration');
    if (latest) latest.expiresAt = new Date(Date.now() - 1000);

    await assert.rejects(
      async () => {
        await otpService.verifyRegistrationOTP({
          identifier: '+919876543212',
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
      phone: '9876543213',
      password: 'password123',
    });

    // Exhaust 3 max attempts
    for (let i = 0; i < 2; i++) {
      try {
        await otpService.verifyRegistrationOTP({
          identifier: '+919876543213',
          otp: `11111${i}`,
        });
      } catch (e) {
        // Expected
      }
    }

    // 3rd failed attempt should trigger maximum attempts exceeded
    await assert.rejects(
      async () => {
        await otpService.verifyRegistrationOTP({
          identifier: '+919876543213',
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
      phone: '9876543214',
      password: 'password123',
    });

    // Immediate second attempt should trigger cooldown error
    await assert.rejects(
      async () => {
        await otpService.sendRegistrationOTP({
          name: 'Neha Gupta',
          email: 'neha.gupta@example.com',
          phone: '9876543214',
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
  test('6. Successful verification: activates user with phone_verified = true and returns tokens', async () => {
    const plainOtp = '654321';
    const otpHash = hashOTP(plainOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await otpRepository.create({
      identifier: '+919876543215',
      purpose: 'registration',
      channel: 'sms',
      otpHash,
      metadata: {
        name: 'Ananya Roy',
        email: 'ananya.roy@example.com',
        phone: '+919876543215',
        passwordHash: '$2a$10$abcdefghijklmnopqrstuu',
      },
      expiresAt,
    });

    const result = await otpService.verifyRegistrationOTP({
      identifier: '9876543215', // Accepts 10-digit input, internally normalizes to +91
      otp: plainOtp,
    });

    assert.ok(result.token);
    assert.ok(result.refreshToken);
    assert.equal(result.user.email, 'ananya.roy@example.com');
    assert.equal(result.user.phoneVerified, true);

    // Verify user is now created in store
    const createdUser = await authRepository.findByEmail('ananya.roy@example.com');
    assert.ok(createdUser);
    assert.equal(createdUser.phone, '+919876543215');
    assert.equal(Boolean(createdUser.phone_verified), true);
  });

  // 7. Duplicate email
  test('7. Duplicate email: blocks registration if email already registered', async () => {
    // Pre-create existing user
    await authRepository.create({
      name: 'Existing User',
      email: 'existing@example.com',
      password: 'hashedpassword',
      phone: '+919876543216',
    });

    await assert.rejects(
      async () => {
        await otpService.sendRegistrationOTP({
          name: 'New Person',
          email: 'existing@example.com',
          phone: '9876543217',
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
        assert.match(err.message, /already registered/);
        return true;
      }
    );
  });

  // 9. Forgot password via mobile
  test('9. Forgot password: sends SMS OTP for existing mobile number', async () => {
    await authRepository.create({
      name: 'Student One',
      email: 'student1@example.com',
      password: 'hashedpassword',
      phone: '+919988776655',
    });

    const res = await otpService.sendForgotPasswordOTP({
      identifier: '9988776655',
    });

    assert.equal(res.success, true);
    assert.equal(res.channel, 'sms');
    assert.ok(res.maskedIdentifier.includes('******6655'));

    const record = await otpRepository.findLatestActive('+919988776655', 'password_reset');
    assert.ok(record);
    assert.equal(record.channel, 'sms');
  });

  // 10. Non-existing account enumeration protection
  test('10. Non-existing account enumeration protection: returns uniform success without creating OTP', async () => {
    const res = await otpService.sendForgotPasswordOTP({
      identifier: '9876500000',
    });

    // Returns success so attackers cannot enumerate
    assert.equal(res.success, true);
    assert.match(res.message, /If an account matches our records/);

    // Verifies NO OTP was actually generated in DB
    const record = await otpRepository.findLatestActive('+919876500000', 'password_reset');
    assert.equal(record, null);
  });

  // 11. Successful password reset via mobile OTP
  test('11. Successful password reset: verifies reset OTP and updates password with resetToken', async () => {
    const testUser = await authRepository.create({
      name: 'Reset Student',
      email: 'reset.student@example.com',
      password: 'oldHashedPassword',
      phone: '+919876543218',
    });

    const plainOtp = '778899';
    const otpHash = hashOTP(plainOtp);

    await otpRepository.create({
      userId: testUser.id,
      identifier: '+919876543218',
      purpose: 'password_reset',
      channel: 'sms',
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Verify OTP to obtain reset token
    const verifyRes = await otpService.verifyResetPasswordOTP({
      identifier: '9876543218',
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
      identifier: '+919876543219',
      purpose: 'registration',
      channel: 'sms',
      otpHash,
      metadata: {
        name: 'Reuse Test',
        email: 'reuse.test@example.com',
        phone: '+919876543219',
        passwordHash: 'somehash',
      },
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // First use: success
    await otpService.verifyRegistrationOTP({
      identifier: '+919876543219',
      otp: plainOtp,
    });

    // Second use: must fail
    await assert.rejects(
      async () => {
        await otpService.verifyRegistrationOTP({
          identifier: '+919876543219',
          otp: plainOtp,
        });
      },
      (err) => {
        assert.match(err.message, /already exists|already registered|Invalid or expired/);
        return true;
      }
    );
  });

  // 13. Rate limiting / Cooldown on resend
  test('13. Rate limiting / Cooldown: resend handler blocks request within cooldown', async () => {
    await otpService.sendRegistrationOTP({
      name: 'Cooldown User',
      email: 'cooldown@example.com',
      phone: '9876543220',
      password: 'password123',
    });

    await assert.rejects(
      async () => {
        await otpService.resendOTP({
          identifier: '9876543220',
          purpose: 'registration',
        });
      },
      (err) => {
        assert.match(err.message, /Please wait/);
        return true;
      }
    );
  });

  // 14. Invalid mobile number validation
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
    assert.equal(formatE164IndianMobile('9876543210'), '+919876543210');
    assert.equal(maskPhone('9876543210'), '+91 ******3210');
  });

  // 15. Invalid email validation
  test('15. Invalid email: rejects invalid email formats during OTP requests', async () => {
    await assert.rejects(
      async () => {
        await otpService.sendRegistrationOTP({
          name: 'Invalid Email User',
          email: 'not-an-email',
          phone: '9876543221',
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
    const smsRes = await smsOtpProvider.sendOtp({
      phone: 'invalid',
      otp: '123456',
    });
    assert.equal(smsRes.success, false);
    assert.match(smsRes.error, /Invalid Indian mobile/);
  });
});
