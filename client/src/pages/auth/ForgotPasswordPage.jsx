import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, verifyResetOtp, resetPassword, resendOtp } from '../../api/authApi';
import OtpInput from '../../components/common/OtpInput';
import toast from 'react-hot-toast';

/**
 * 3-Step Account Recovery / Password Reset Page
 * Step 1: Enter registered email or Indian mobile number
 * Step 2: 6-Digit OTP Verification with countdown timer & resend cooldown
 * Step 3: Set New Password & Confirm Password
 */
const ForgotPasswordPage = () => {
  const [step, setStep] = useState('request'); // 'request' | 'otp' | 'reset' | 'success'
  const [identifier, setIdentifier] = useState('');
  const [maskedIdentifier, setMaskedIdentifier] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(60);

  const navigate = useNavigate();

  // STEP 1: Request Password Reset OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!identifier.trim()) {
      toast.error('Please enter your email or mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword({ identifier: identifier.trim() });
      const data = res.data?.data || res.data;

      setMaskedIdentifier(data?.maskedIdentifier || identifier);
      setCooldownSeconds(data?.cooldownSeconds || 60);

      toast.success(res.data?.message || 'Verification code dispatched.');
      setStep('otp');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to dispatch reset code.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (otpCode) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await verifyResetOtp({
        identifier: identifier.trim(),
        otp: otpCode,
      });

      const data = res.data?.data || res.data;
      if (!data?.resetToken) {
        throw new Error('Verification failed: No reset authorization received.');
      }

      setResetToken(data.resetToken);
      toast.success('Code verified! Please choose your new password.');
      setStep('reset');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired verification code.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setErrorMessage('');
    try {
      const res = await resendOtp({
        identifier: identifier.trim(),
        purpose: 'password_reset',
      });
      const msg = res.data?.message || 'A new verification code has been dispatched.';
      toast.success(msg);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend code.';
      setErrorMessage(msg);
      toast.error(msg);
      throw err;
    }
  };

  // STEP 3: Submit New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        resetToken,
        newPassword,
      });

      toast.success('Password reset successfully!');
      setStep('success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Password reset failed.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 0', display: 'flex', justifyContent: 'center' }}>
      <div className="card-glass" style={{ padding: '2.5rem', width: '100%', maxWidth: '480px' }}>
        {/* STEP 1: Enter Identifier */}
        {step === 'request' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 1.25rem',
                  backgroundColor: 'var(--primary-subtle)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-1-1l2 2" />
                  <path d="M15.5 8.5L7 17l-3-3 8.5-8.5a2.121 2.121 0 0 1 3 3z" />
                  <circle cx="16.5" cy="7.5" r="4.5" />
                </svg>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Forgot Password
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                Enter your registered email address or mobile number to receive a verification code.
              </p>
            </div>

            {errorMessage && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  backgroundColor: 'var(--danger-subtle)',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger-dark)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label className="form-label">Email or Mobile Number</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. rahul@example.com or 9876543210"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
                style={{ padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.75rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                &larr; Back to Login
              </Link>
            </div>
          </>
        )}

        {/* STEP 2: Verify 6-digit OTP */}
        {step === 'otp' && (
          <OtpInput
            maskedIdentifier={maskedIdentifier}
            cooldownSeconds={cooldownSeconds}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            isLoading={loading}
            error={errorMessage}
            onChangeError={setErrorMessage}
            onBack={() => {
              setStep('request');
              setErrorMessage('');
            }}
            submitLabel="Verify Code"
          />
        )}

        {/* STEP 3: Create New Password */}
        {step === 'reset' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Create New Password
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                Your code has been verified. Choose a strong new password for your account.
              </p>
            </div>

            {errorMessage && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  marginBottom: '1.25rem',
                  backgroundColor: 'var(--danger-subtle)',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger-dark)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
                style={{ padding: '0.75rem', fontSize: '1rem', marginTop: '0.5rem' }}
              >
                {loading ? 'Saving Password...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        {/* STEP 4: Success Confirmation */}
        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 1.5rem',
                backgroundColor: 'var(--accent-subtle)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-dark)',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Password Reset Complete!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '2rem', lineHeight: 1.6 }}>
              Your password has been successfully updated. You can now login with your new credentials.
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="btn btn-primary btn-full"
              style={{ padding: '0.75rem', fontSize: '1rem' }}
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
