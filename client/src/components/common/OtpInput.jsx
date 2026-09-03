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
  onVerify,
  onResend,
  isLoading = false,
  error = '',
  onChangeError,
  onBack,
  submitLabel = 'Verify OTP',
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(cooldownSeconds);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

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
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
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
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Enter Verification Code
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
          We sent a 6-digit code to{' '}
          <strong style={{ color: 'var(--primary-dark)', wordBreak: 'break-all' }}>
            {maskedIdentifier}
          </strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* 6 Digit Input Group */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            margin: '0.5rem 0',
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
                height: '54px',
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

        {/* Verify Action Button */}
        <button
          type="submit"
          disabled={!isComplete || isLoading}
          className="btn btn-primary btn-full"
          style={{ padding: '0.75rem', fontSize: '1rem', marginTop: '0.25rem' }}
        >
          {isLoading ? 'Verifying Code...' : submitLabel}
        </button>

        {/* Resend Cooldown & Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.875rem',
          }}
        >
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="btn btn-ghost btn-sm"
              style={{ padding: 0, color: 'var(--text-muted)' }}
            >
              &larr; Change Details
            </button>
          ) : (
            <span />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                {isResending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default OtpInput;
