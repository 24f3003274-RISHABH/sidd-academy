import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { register as apiRegister, verifyRegistrationOtp, resendOtp } from '../../api/authApi';
import OtpInput from '../../components/common/OtpInput';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Step state: 'form' | 'otp'
  const [step, setStep] = useState('form');
  const [otpInfo, setOtpInfo] = useState({
    identifier: '',
    maskedEmail: '',
    maskedPhone: '',
    cooldownSeconds: 60,
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { completeAuthSession } = useAuth();
  const navigate = useNavigate();

  // STEP 1: Submit Registration Form to get OTP
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await apiRegister({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      const data = res.data?.data || res.data;
      setOtpInfo({
        identifier: data?.identifier || formData.email.trim().toLowerCase(),
        maskedEmail: data?.maskedEmail || formData.email,
        maskedPhone: data?.maskedPhone || formData.phone,
        cooldownSeconds: data?.cooldownSeconds || 60,
      });

      toast.success('Verification code sent to your email!');
      setStep('otp');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP and finalize account creation
  const handleVerifyOtp = async (otpCode) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await verifyRegistrationOtp({
        identifier: otpInfo.identifier,
        otp: otpCode,
      });

      const payload = res.data?.data || res.data;
      completeAuthSession(payload);

      toast.success('Account created successfully! Welcome to Sidd Academy.');
      const role = (payload?.user?.role || '').toLowerCase();
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification failed';
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
        identifier: otpInfo.identifier,
        purpose: 'registration',
      });
      const msg = res.data?.message || 'A new verification code has been dispatched.';
      toast.success(msg);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend OTP.';
      setErrorMessage(msg);
      toast.error(msg);
      throw err;
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 0', display: 'flex', justifyContent: 'center' }}>
      <div className="card-glass" style={{ padding: '2.5rem', width: '100%', maxWidth: '480px' }}>
        {step === 'form' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                Create Account
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                Join Sidd Academy for Classes 10th, 11th & 12th
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

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="rahul@example.com"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Mobile Number (India)</label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optional</span>
                </div>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit number e.g. 9876543210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 6 characters"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
                style={{ marginTop: '0.5rem', padding: '0.75rem' }}
              >
                {loading ? 'Sending Verification Code...' : 'Continue to Verification'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <p>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  Login
                </Link>
              </p>
            </div>
          </>
        ) : (
          <OtpInput
            maskedIdentifier={otpInfo.maskedEmail}
            channel="email"
            cooldownSeconds={otpInfo.cooldownSeconds}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            isLoading={loading}
            error={errorMessage}
            onChangeError={setErrorMessage}
            onBack={() => {
              setStep('form');
              setErrorMessage('');
            }}
            submitLabel="Verify & Create Account"
          />
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
