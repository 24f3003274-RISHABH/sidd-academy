import React, { useState } from 'react';
import { FiPlay, FiExternalLink, FiClock, FiFileText } from 'react-icons/fi';
import { getYouTubeThumbnail, getYouTubeWatchUrl } from '../../utils/helpers';
import VideoModal from './VideoModal';

const YouTubeVideoCard = ({ video, onNoteClick }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    _id,
    title,
    description,
    videoUrl,
    duration,
    isFree,
    notesUrl,
    chapterTitle,
    thumbnailUrl,
  } = video;

  const thumbnail = thumbnailUrl || getYouTubeThumbnail(videoUrl);
  const watchUrl = getYouTubeWatchUrl(videoUrl);

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleOpenYoutubeDirectly = (e) => {
    e.stopPropagation();
    window.open(watchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div 
        id={`video-card-${_id}`}
        className="card-glass" 
        onClick={handleCardClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        }}
      >
        {/* Video Thumbnail with YouTube Play Badge */}
        <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#000', overflow: 'hidden' }}>
          <img 
            src={thumbnail} 
            alt={title} 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
          />
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 0, 0, 0.9)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(255, 0, 0, 0.5)',
                transition: 'transform 0.2s ease',
              }}
            >
              <FiPlay size={22} style={{ marginLeft: '3px' }} />
            </div>
          </div>

          {/* Badges */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '0.4rem' }}>
            <span 
              className={`badge ${isFree ? 'badge-success' : 'badge-primary'}`}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', fontWeight: 600 }}
            >
              {isFree ? 'Free Preview' : 'Pro Lecture'}
            </span>
          </div>

          {duration && (
            <div 
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <FiClock size={12} /> {duration}
            </div>
          )}
        </div>

        {/* Video Card Content */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.6rem' }}>
          {chapterTitle && (
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>
              {chapterTitle}
            </span>
          )}
          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
            {title}
          </h4>
          {description && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, flex: 1 }}>
              {description}
            </p>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={handleOpenYoutubeDirectly}
              id={`yt-btn-${_id}`}
              className="btn btn-sm"
              style={{
                backgroundColor: 'rgba(255, 0, 0, 0.12)',
                color: '#ff4d4d',
                border: '1px solid rgba(255, 0, 0, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                padding: '0.35rem 0.7rem',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              YouTube <FiExternalLink size={12} />
            </button>

            {notesUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNoteClick) onNoteClick(video);
                  else window.open(notesUrl, '_blank');
                }}
                className="btn btn-sm btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8rem',
                  padding: '0.35rem 0.7rem',
                  borderRadius: '6px',
                }}
              >
                <FiFileText size={12} /> Notes PDF
              </button>
            )}
          </div>
        </div>
      </div>

      <VideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoUrl={videoUrl}
        title={title}
        description={description}
        chapterTitle={chapterTitle}
      />
    </>
  );
};

export default YouTubeVideoCard;
