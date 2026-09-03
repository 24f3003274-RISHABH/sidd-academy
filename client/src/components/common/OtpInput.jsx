import React, { useState, useEffect, useRef } from 'react';

/**
 * Reusable 6-Digit OTP Verification Component
 * Features:
 * - 6 separate digit boxes with auto-advance, backspace navigation, and full paste handling
 * - Real-time countdown timer for resend cooldown
 * - Clear inline error messages (expired, rate-limited, invalid, attempts left)
 * - Loading indicator during verification and resend
 * - Masked email / mobile indicators
 */
const OtpInput = ({
  maskedIdentifier,
  channel = 'email',
  cooldownSeconds = 60,
  expirySeconds = 300, // 5 minutes default
  onVerify,
  onResend,
  isLoading = false,
  error = '',
  onChangeError,
  onBack,
  title,
  submitLabel,
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(cooldownSeconds);
  const [expiryTimer, setExpiryTimer] = useState(expirySeconds);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  const computedTitle = title || (channel === 'sms' ? 'Verify Mobile Number' : 'Enter Verification Code');
  const computedSubmitLabel = submitLabel || (channel === 'sms' ? 'Verify Mobile Number' : 'Verify OTP');

  // Format seconds to MM:SS
  const formatTime = (totalSec) => {
    const mins = Math.floor(Math.max(0, totalSec) / 60);
    const secs = Math.max(0, totalSec) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Expiry countdown timer (5:00)
  useEffect(() => {
    let interval = null;
    if (expiryTimer > 0) {
      interval = setInterval(() => {
        setExpiryTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [expiryTimer]);

  // Handle individual digit input
  const handleDigitChange = (index, value) => {
    if (onChangeError) onChangeError('');

    // If pasted multi-digit value
    if (value.length > 1) {
      const numericString = value.replace(/\D/g, '').slice(0, 6);
      if (numericString.length > 0) {
        const nextDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = numericString[i] || '';
        }
        setDigits(nextDigits);
        const focusIndex = Math.min(numericString.length, 5);
        if (inputRefs.current[focusIndex]) {
          inputRefs.current[focusIndex].focus();
        }
      }
      return;
    }

    // Single digit input
    const cleanChar = value.replace(/\D/g, '');
    const nextDigits = [...digits];
    nextDigits[index] = cleanChar;
    setDigits(nextDigits);

    // Auto-focus next input box if a digit was entered
    if (cleanChar && index < 5) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  // Handle key navigation (Backspace, ArrowLeft, ArrowRight)
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        if (inputRefs.current[index - 1]) {
          inputRefs.current[index - 1].focus();
        }
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowRight' && index < 5) {
      if (inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  // Handle paste on any digit box
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const numericData = pastedData.replace(/\D/g, '').slice(0, 6);
    if (!numericData) return;

    const nextDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < numericData.length; i++) {
      nextDigits[i] = numericData[i];
    }
    setDigits(nextDigits);
    const focusIndex = Math.min(numericData.length, 5);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }
  };

  const fullOtp = digits.join('');
  const isComplete = fullOtp.length === 6;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isComplete || isLoading) return;
    onVerify(fullOtp);
  };

  const handleResendClick = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    if (onChangeError) onChangeError('');
    try {
      await onResend();
      setDigits(['', '', '', '', '', '']);
      setTimer(cooldownSeconds);
      setExpiryTimer(expirySeconds);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '52px',
            height: '52px',
            margin: '0 auto 1rem',
            backgroundColor: 'var(--primary-subtle)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}
        >
          {channel === 'sms' ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </div>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
          {computedTitle}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
          OTP sent to{' '}
          <strong style={{ color: 'var(--primary-dark)', wordBreak: 'break-all' }}>
            {maskedIdentifier}
          </strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* 6 Digit Input Group: [ _ ] [ _ ] [ _ ] [ _ ] [ _ ] [ _ ] */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            margin: '0.25rem 0',
          }}
          onPaste={handlePaste}
        >
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={2}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              disabled={isLoading}
              style={{
                width: '46px',
                height: '52px',
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: '700',
                borderRadius: 'var(--radius-md)',
                border: digit ? '2px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: '#ffffff',
                color: 'var(--text-primary)',
                outline: 'none',
                boxShadow: digit ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'var(--shadow-xs)',
                transition: 'all var(--transition-fast)',
              }}
            />
          ))}
        </div>

        {/* OTP Expiry Countdown (05:00) */}
        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {expiryTimer > 0 ? (
            <span>
              OTP expires in{' '}
              <strong style={{ color: expiryTimer < 60 ? 'var(--danger-dark)' : 'var(--text-primary)', fontWeight: 600 }}>
                {formatTime(expiryTimer)}
              </strong>
            </span>
          ) : (
            <span style={{ color: 'var(--danger-dark)', fontWeight: 600 }}>
              OTP expired. Please request a new code.
            </span>
          )}
        </div>

        {/* Dynamic Error State */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--danger-subtle)',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger-dark)',
              fontSize: '0.875rem',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* Resend OTP Section: Didn't receive the OTP? [Resend OTP] */}
        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          <p style={{ margin: 0, marginBottom: '0.35rem' }}>Didn't receive the OTP?</p>
          {timer > 0 ? (
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
              Resend code in <strong style={{ color: 'var(--primary)' }}>{timer}s</strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResendClick}
              disabled={isResending || isLoading}
              style={{
                color: 'var(--primary)',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: '0.25rem 0.5rem',
                textDecoration: 'underline',
                fontSize: '0.875rem',
              }}
            >
              {isResending ? 'Sending...' : 'Resend OTP'}
            </button>
          )}
        </div>

        {/* Verify Action Button: [Verify Mobile Number] */}
        <button
          type="submit"
          disabled={!isComplete || isLoading}
          className="btn btn-primary btn-full"
          style={{ padding: '0.75rem', fontSize: '1rem', marginTop: '0.25rem' }}
        >
          {isLoading ? 'Verifying...' : computedSubmitLabel}
        </button>

        {/* Change Details link */}
        {onBack && (
          <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.25rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}
            >
              &larr; Change Details
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default OtpInput;
