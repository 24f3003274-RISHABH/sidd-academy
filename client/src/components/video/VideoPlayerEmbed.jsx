import React, { useMemo } from 'react';
import { FiLock, FiPlay, FiYoutube, FiExternalLink, FiClock, FiCheckCircle } from 'react-icons/fi';

/**
 * Extract YouTube Video ID from any YouTube URL format
 */
export const extractYoutubeId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) return cleanUrl;

  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = cleanUrl.match(regExp);
  return match ? match[1] : null;
};

/**
 * Extract YouTube Playlist ID
 */
export const extractPlaylistId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/[?&]list=([^#\&\?]+)/i);
  return match ? match[1] : null;
};

/**
 * VideoPlayerEmbed Component
 * Renders an embedded YouTube video or playlist with locked states and responsive container
 */
const VideoPlayerEmbed = ({
  videoUrl,
  playlistUrl,
  title = 'Class Video Lecture',
  thumbnailUrl,
  isLocked = false,
  isFree = true,
  duration,
  onUnlock,
  autoPlay = false,
}) => {
  const youtubeId = useMemo(() => extractYoutubeId(videoUrl), [videoUrl]);
  const playlistId = useMemo(() => extractPlaylistId(playlistUrl || videoUrl), [playlistUrl, videoUrl]);

  // Construct privacy-enhanced YouTube embed URL
  const embedUrl = useMemo(() => {
    if (playlistId && !youtubeId) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&rel=0&modestbranding=1&enablejsapi=1`;
    }
    if (youtubeId) {
      const base = `https://www.youtube-nocookie.com/embed/${youtubeId}`;
      const params = new URLSearchParams({
        rel: '0',
        modestbranding: '1',
        enablejsapi: '1',
      });
      if (playlistId) params.append('list', playlistId);
      if (autoPlay) params.append('autoplay', '1');
      return `${base}?${params.toString()}`;
    }
    return null;
  }, [youtubeId, playlistId, autoPlay]);

  // Locked State View
  if (isLocked) {
    const poster = thumbnailUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null);

    return (
      <div
        id="locked-video-player"
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '56.25%', // 16:9 Aspect Ratio
          backgroundColor: '#0f111a',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {poster && (
          <img
            src={poster}
            alt={title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(8px) brightness(0.35)',
              transform: 'scale(1.05)',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            zIndex: 2,
            background: 'radial-gradient(circle, rgba(15,17,26,0.85) 0%, rgba(15,17,26,0.98) 100%)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 117, 140, 0.15)',
              border: '1px solid rgba(255, 117, 140, 0.3)',
              color: '#ff758c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <FiLock size={28} />
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#ff758c',
              marginBottom: '0.5rem',
            }}
          >
            Premium Video Lecture
          </span>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.25rem', maxWidth: '500px' }}>
            {title}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '450px', marginBottom: '1.5rem' }}>
            This lecture is part of the full course curriculum. Enroll now to unlock all high-definition video sessions, chapter notes, and assignments.
          </p>
          {onUnlock && (
            <button
              onClick={onUnlock}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 2rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                borderRadius: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(108, 99, 255, 0.4)',
              }}
            >
              <FiLock size={16} /> Enroll to Unlock Lecture
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active Embedded Video Player View
  return (
    <div
      id="embedded-video-player"
      style={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%', // 16:9 Aspect Ratio
        backgroundColor: '#0a0b10',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <FiYoutube size={48} style={{ color: '#ff0000', marginBottom: '1rem', opacity: 0.8 }} />
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>Video Stream Pending</h4>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            No YouTube video stream URL has been linked to this lesson yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayerEmbed;
