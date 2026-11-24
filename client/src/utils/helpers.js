export const formatPrice = (amount) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return 'Free';
  return `₹${numericAmount.toLocaleString('en-IN')}`;
};

export const getEffectivePrice = (resource) => {
  if (!resource || resource.isFree) return 0;
  const price = Number(resource.price) || 0;
  const discountPrice = Number(resource.discountPrice);
  return discountPrice > 0 && discountPrice < price ? discountPrice : price;
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatFileSize = (bytes) => {
  if (typeof bytes === 'string' && bytes.trim()) return bytes;
  if (bytes === 0 || !bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const truncateText = (text, length) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const getBackendOrigin = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isBrowserRemote =
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const cleaned = envUrl.trim();
    const isLocalEnvUrl = cleaned.includes('localhost') || cleaned.includes('127.0.0.1');
    if (!(isBrowserRemote && isLocalEnvUrl)) {
      try {
        const urlObj = new URL(cleaned);
        return urlObj.origin;
      } catch {
        return cleaned.replace(/\/api(\/v1)?\/?$/, '');
      }
    }
  }
  return import.meta.env.DEV && !isBrowserRemote
    ? 'http://localhost:5000'
    : 'https://sidd-academy.onrender.com';
};

export const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const origin = getBackendOrigin();
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const extractDriveFileId = (input) => {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  if (dMatch) return dMatch[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (idMatch) return idMatch[1];
  return null;
};

/**
 * Resolve the authenticated portal PDF stream URL for a study material
 */
export const getNoteStreamUrl = (note) => {
  if (!note) return '';
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('siddToken') : '';
  const noteId = note.id || note._id;
  if (noteId) {
    const base = `${getBackendOrigin()}/api/v1/notes/${noteId}/stream`;
    return token && token !== 'undefined' && token !== 'null'
      ? `${base}?token=${encodeURIComponent(token)}`
      : base;
  }
  return resolveMediaUrl(note.localFileUrl || note.fileUrl || '');
};

/**
 * Resolve Google Drive embed preview URL (`https://drive.google.com/file/d/<ID>/preview`)
 */
export const getNoteDrivePreviewUrl = (note) => {
  if (!note) return null;
  if (note.drivePreviewUrl) return note.drivePreviewUrl;
  const driveId = note.driveFileId || extractDriveFileId(note.driveViewUrl || note.fileUrl);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }
  return null;
};

/**
 * Resolve Google Drive direct view link (`https://drive.google.com/file/d/<ID>/view`)
 */
export const getNoteDriveViewUrl = (note) => {
  if (!note) return null;
  if (note.driveViewUrl) return note.driveViewUrl;
  const driveId = note.driveFileId || extractDriveFileId(note.fileUrl);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/view?usp=drivesdk`;
  }
  if (note.fileUrl && note.fileUrl.includes('drive.google.com')) {
    return note.fileUrl;
  }
  return null;
};

/**
 * Resolve direct file download URL for a note
 */
export const getNoteDownloadUrl = (note) => {
  if (!note) return '';
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('siddToken') : '';
  const noteId = note.id || note._id;
  if (noteId) {
    const base = `${getBackendOrigin()}/api/v1/notes/${noteId}/download?direct=true`;
    return token && token !== 'undefined' && token !== 'null'
      ? `${base}&token=${encodeURIComponent(token)}`
      : base;
  }
  return getNoteDriveViewUrl(note) || resolveMediaUrl(note.fileUrl || '');
};

export const getYouTubeVideoId = (url) => {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : '';
};

export const getYouTubeThumbnail = (url, quality = 'hqdefault') => {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
  }
  return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80';
};

export const getYouTubeWatchUrl = (url) => {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url || 'https://www.youtube.com';
};

export const getYouTubeEmbedUrl = (url) => {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` : url;
};

export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};
