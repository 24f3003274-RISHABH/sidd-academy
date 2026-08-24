import React from 'react';
import { FiFileText, FiDownload, FiDollarSign } from 'react-icons/fi';
import { formatPrice, formatFileSize } from '../../utils/helpers';

const NoteCard = ({ note, onDownload, onPurchase, canDownload, isPurchasing }) => {
  return (
    <div id={`note-card-${note._id}`} className="note-card card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.9rem', backgroundColor: 'rgba(108, 99, 255, 0.12)', borderRadius: '10px', color: 'var(--primary)' }}>
          <FiFileText size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 600 }}>
            {note.level || 'Study Notes'}
          </span>
          <h3 style={{ fontSize: '1.05rem', margin: '0.2rem 0', lineHeight: 1.3 }}>{note.title}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            {typeof note.subject === 'object' ? note.subject?.name : note.subject || 'General'}
          </p>
        </div>
      </div>
      
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', flex: 1, lineHeight: 1.5 }}>
        {note.description}
      </p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <span style={{ fontWeight: 'bold', color: note.isFree ? 'var(--accent)' : 'var(--primary)', fontSize: '1.1rem' }}>
            {note.isFree ? 'Free' : formatPrice(note.price)}
          </span>
          {note.pageCount && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
              ({note.pageCount} pgs)
            </span>
          )}
        </div>
        
        {canDownload ? (
          <button 
            onClick={() => onDownload(note._id, note.title)} 
            className="btn btn-sm btn-outline" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FiDownload /> Download
          </button>
        ) : (
          <button 
            onClick={() => onPurchase(note)} 
            disabled={isPurchasing} 
            className="btn btn-sm btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FiDollarSign /> {isPurchasing ? 'Processing...' : 'Buy Now'}
          </button>
        )}
      </div>
    </div>
  );
};

export default NoteCard;
