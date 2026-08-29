import React from 'react';
import { FiAlertTriangle, FiCheck, FiX } from 'react-icons/fi';

const ConfirmationModal = ({
  isOpen,
  title = 'Are you sure?',
  message = 'Please confirm your action to proceed.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'primary' | 'success'
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  const getConfirmBtnClass = () => {
    if (confirmVariant === 'danger') return 'btn btn-danger';
    if (confirmVariant === 'success') return 'btn btn-success';
    return 'btn btn-primary';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
      onClick={onCancel}
    >
      <div
        className="card-glass"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#131728',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: confirmVariant === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(108, 99, 255, 0.15)',
              color: confirmVariant === 'danger' ? '#ef4444' : 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '1.25rem',
            }}
          >
            {confirmVariant === 'danger' ? <FiAlertTriangle /> : <FiCheck />}
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>{title}</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={loading}
            style={{ padding: '0.6rem 1.25rem' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={getConfirmBtnClass()}
            onClick={onConfirm}
            disabled={loading}
            style={{ padding: '0.6rem 1.25rem' }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
