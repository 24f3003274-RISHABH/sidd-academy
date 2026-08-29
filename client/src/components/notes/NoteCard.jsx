import React from 'react';
import { FiFileText, FiDownload, FiLock, FiCheckCircle, FiEye, FiBookOpen } from 'react-icons/fi';
import { formatPrice, formatFileSize } from '../../utils/helpers';

/**
 * NoteCard Component
 * Displays digital study note card with Free/Paid badges, price display, and locked resource states.
 */
const NoteCard = ({
  note,
  onDownload,
  onPurchase,
  onPreview,
  isAuthenticated,
  user,
  isPurchasing,
}) => {
  // Determine if user has unlocked access
  const isPurchased = isAuthenticated && (user?.purchasedNotes?.includes(note.id || note._id) || user?.role === 'admin');
  const isLocked = !note.isFree && !isPurchased && note.isLocked !== false;

  return (
    <div
      id={`note-card-${note.id || note._id}`}
      className="card-glass"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        border: isLocked ? '1px solid rgba(255, 117, 140, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        background: isLocked
          ? 'linear-gradient(180deg, rgba(27, 28, 43, 0.9) 0%, rgba(20, 21, 33, 0.9) 100%)'
          : 'rgba(255, 255, 255, 0.03)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = isLocked ? 'rgba(255, 117, 140, 0.4)' : 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = isLocked ? 'rgba(255, 117, 140, 0.2)' : 'rgba(255, 255, 255, 0.08)';
      }}
    >
      {/* Top Badges & Subject Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--primary)',
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}
        >
          {note.subjectTitle || (typeof note.subject === 'object' ? note.subject?.name : note.subject) || 'Academic Study Note'}
        </span>

        {/* Free vs Paid Badges */}
        {note.isFree ? (
          <span
            className="badge badge-success"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.25rem 0.6rem',
            }}
          >
            <FiCheckCircle size={12} /> FREE PDF
          </span>
        ) : (
          <span
            style={{
              backgroundColor: 'rgba(255, 117, 140, 0.15)',
              color: '#ff758c',
              border: '1px solid rgba(255, 117, 140, 0.3)',
              borderRadius: '6px',
              padding: '0.25rem 0.6rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            {isLocked ? <FiLock size={12} /> : <FiCheckCircle size={12} />}
            {isLocked ? 'PREMIUM PDF' : 'UNLOCKED'}
          </span>
        )}
      </div>

      {/* Note Title and File Icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', marginBottom: '0.85rem' }}>
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: note.isFree ? 'rgba(67, 233, 123, 0.12)' : 'rgba(108, 99, 255, 0.12)',
            borderRadius: '10px',
            color: note.isFree ? '#43e97b' : 'var(--primary)',
            flexShrink: 0,
          }}
        >
          <FiFileText size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: '1.05rem',
              margin: '0 0 0.25rem 0',
              lineHeight: 1.35,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            {note.title}
          </h3>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>
            {note.chapterTitle || 'Chapter Formulas & Practice Set'}
          </span>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
          flex: 1,
          lineHeight: 1.5,
        }}
      >
        {note.description || 'Detailed handwritten notes with theory concepts, derivations, and solved board problems.'}
      </p>

      {/* Meta Specs (Pages & File Size) */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <span>📄 {note.pageCount || 24} Pages</span>
        <span>💾 {note.fileSize || '2.5 MB'}</span>
        <span>📥 {note.downloadsCount || 0} Downloads</span>
      </div>

      {/* Footer: Price & Action CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span
            style={{
              fontWeight: 800,
              color: note.isFree ? '#43e97b' : '#fff',
              fontSize: '1.2rem',
            }}
          >
            {note.isFree ? 'FREE' : formatPrice(note.price)}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isLocked ? (
            <button
              id={`unlock-note-${note.id || note._id}`}
              onClick={() => onPurchase && onPurchase(note)}
              disabled={isPurchasing}
              className="btn btn-sm btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#ff6584',
                borderColor: '#ff6584',
                fontWeight: 600,
                fontSize: '0.82rem',
                padding: '0.45rem 0.9rem',
              }}
            >
              <FiLock size={13} /> {isPurchasing ? 'Processing...' : `Unlock (${formatPrice(note.price)})`}
            </button>
          ) : (
            <>
              {onPreview && (
                <button
                  onClick={() => onPreview(note)}
                  className="btn btn-sm btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                >
                  <FiEye size={13} /> Preview
                </button>
              )}
              <button
                id={`download-note-${note.id || note._id}`}
                onClick={() => onDownload && onDownload(note.id || note._id, note.title)}
                className="btn btn-sm btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <FiDownload size={14} /> Download
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
