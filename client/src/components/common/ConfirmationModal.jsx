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
      className="confirmation-overlay"
      onClick={onCancel}
    >
      <div
        className="confirmation-dialog card"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
          <div
            className={`confirmation-icon ${confirmVariant === 'danger' ? 'is-danger' : 'is-neutral'}`}
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
