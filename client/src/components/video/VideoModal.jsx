import React from 'react';
import { FiX, FiExternalLink, FiYoutube } from 'react-icons/fi';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '../../utils/helpers';

const VideoModal = ({ isOpen, onClose, videoUrl, title, description, chapterTitle }) => {
  if (!isOpen) return null;

  const embedUrl = getYouTubeEmbedUrl(videoUrl);
  const watchUrl = getYouTubeWatchUrl(videoUrl);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#181926',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '860px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '1.2rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}>
          <div>
            {chapterTitle && (
              <span style={{ fontSize: '0.8rem', color: '#939aff', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                {chapterTitle}
              </span>
            )}
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>{title || 'Lecture Video'}</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <a 
              href={watchUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm"
              style={{
                backgroundColor: '#ff0000',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              <FiYoutube size={16} /> Open in YouTube <FiExternalLink size={12} />
            </a>
            <button 
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', backgroundColor: '#000' }}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
              No video URL provided
            </div>
          )}
        </div>

        {description && (
          <div style={{ padding: '1.25rem 1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            {description}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoModal;
