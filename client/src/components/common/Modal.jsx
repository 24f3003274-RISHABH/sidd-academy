import React from 'react';
import { FiX } from 'react-icons/fi';

const Modal = ({ isOpen, onClose, title, children, size = 'md', closeDisabled = false }) => {
  if (!isOpen) return null;

  const sizeClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-4xl' : 'max-w-2xl';

  return (
    <div className="modal-overlay" style={{ display: 'flex' }} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={`modal-box ${sizeClass}`} style={{ width: '100%' }}>
        <div className="modal-header">
          <h3 id="modal-title" className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close" disabled={closeDisabled}>
            <FiX size={24} />
          </button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
