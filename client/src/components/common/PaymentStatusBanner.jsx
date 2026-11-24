import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiAlertCircle,
  FiXCircle,
  FiCheckCircle,
  FiRefreshCw,
  FiX,
  FiLoader,
  FiShoppingBag,
} from 'react-icons/fi';

/**
 * Prominent, actionable in-page checkout status banner.
 * Used across CourseDetailPage, NotesPage, and MyOrdersPage so students ALWAYS get
 * immediate, unmistakable feedback when payment fails, is cancelled, is verifying, or succeeds.
 */
const PaymentStatusBanner = ({
  status, // 'verifying' | 'failed' | 'cancelled' | 'verification_error' | 'success'
  title,
  message,
  orderId,
  paymentId,
  onRetry,
  retryLabel = 'Try Payment Again',
  retrying = false,
  onDismiss,
  showOrdersLink = true,
  compact = false,
}) => {
  if (!status) return null;

  const palette = {
    failed: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#991b1b',
      subtext: '#b91c1c',
      icon: <FiAlertCircle size={20} />,
      defaultTitle: 'Payment Failed',
    },
    verification_error: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#991b1b',
      subtext: '#b91c1c',
      icon: <FiAlertCircle size={20} />,
      defaultTitle: 'Payment Verification Issue',
    },
    cancelled: {
      bg: '#fffbeb',
      border: '#fde68a',
      text: '#92400e',
      subtext: '#b45309',
      icon: <FiXCircle size={20} />,
      defaultTitle: 'Checkout Cancelled',
    },
    verifying: {
      bg: '#eff6ff',
      border: '#bfdbfe',
      text: '#1e40af',
      subtext: '#1d4ed8',
      icon: <FiLoader size={20} style={{ animation: 'loader-spin 1s linear infinite' }} />,
      defaultTitle: 'Verifying Your Payment…',
    },
    success: {
      bg: '#ecfdf5',
      border: '#a7f3d0',
      text: '#065f46',
      subtext: '#047857',
      icon: <FiCheckCircle size={20} />,
      defaultTitle: 'Payment Successful!',
    },
  };

  const theme = palette[status] || palette.cancelled;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        backgroundColor: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: compact ? '0.9rem 1rem' : '1.1rem 1.25rem',
        color: theme.text,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem' }}>
        <div style={{ flexShrink: 0, marginTop: '2px', color: theme.subtext }}>{theme.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: compact ? '0.9rem' : '0.98rem', lineHeight: 1.3 }}>
            {title || theme.defaultTitle}
          </div>
          {message && (
            <div style={{ fontSize: compact ? '0.82rem' : '0.88rem', color: theme.subtext, marginTop: '0.2rem', lineHeight: 1.45 }}>
              {message}
            </div>
          )}
          {(orderId || paymentId) && (
            <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.3rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {orderId && <span>Order: {orderId}</span>}
              {orderId && paymentId && <span> • </span>}
              {paymentId && <span>Payment Ref: {paymentId}</span>}
            </div>
          )}
        </div>
        {onDismiss && status !== 'verifying' && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss payment notice"
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.text,
              opacity: 0.7,
              cursor: 'pointer',
              padding: '2px',
              display: 'inline-flex',
            }}
          >
            <FiX size={16} />
          </button>
        )}
      </div>

      {(onRetry || showOrdersLink) && status !== 'verifying' && status !== 'success' && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingLeft: '1.95rem' }}>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="btn btn-sm btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
            >
              <FiRefreshCw size={13} /> {retrying ? 'Opening Checkout…' : retryLabel}
            </button>
          )}
          {showOrdersLink && (
            <Link
              to="/student/orders"
              className="btn btn-sm btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                backgroundColor: '#ffffff',
              }}
            >
              <FiShoppingBag size={13} /> View Purchase History
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentStatusBanner;
