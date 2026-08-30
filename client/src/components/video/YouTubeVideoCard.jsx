import React, { useState } from 'react';
import { FiPlay, FiExternalLink, FiClock, FiFileText } from 'react-icons/fi';
import { getYouTubeThumbnail, getYouTubeWatchUrl } from '../../utils/helpers';
import VideoModal from './VideoModal';

const YouTubeVideoCard = ({ video, onNoteClick }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    _id,
    id,
    title,
    description,
    videoUrl,
    duration,
    isFree,
    notesUrl,
    chapterTitle,
    thumbnailUrl,
  } = video;

  const videoId = id || _id;
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
        id={`video-card-${videoId}`}
        className="yt-card" 
        onClick={handleCardClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
        }}
      >
        {/* Video Thumbnail with YouTube Play Badge */}
        <div className="yt-thumbnail-wrapper">
          <img 
            src={thumbnail} 
            alt={title} 
            className="yt-thumbnail"
            loading="lazy"
          />
          <div className="yt-play-overlay">
            <div className="yt-play-btn">
              <FiPlay size={20} style={{ marginLeft: '2px' }} />
            </div>
          </div>

          {/* Badges */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '0.4rem', zIndex: 2 }}>
            <span 
              className={`badge ${isFree ? 'badge-success' : 'badge-primary'}`}
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
            >
              {isFree ? 'Free Lecture' : 'Video Class'}
            </span>
          </div>

          {duration && (
            <div 
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: '#ffffff',
                padding: '0.2rem 0.45rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                zIndex: 2,
              }}
            >
              <FiClock size={12} /> {duration}
            </div>
          )}
        </div>

        {/* Video Card Content */}
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>
          {chapterTitle && (
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {chapterTitle}
            </span>
          )}
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
            {title}
          </h4>
          {description && (
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {description}
            </p>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={handleOpenYoutubeDirectly}
              id={`yt-btn-${videoId}`}
              className="btn btn-sm"
              style={{
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 600,
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
