import { videoRepository } from '../repositories/video.repository.js';
import { lessonRepository } from '../repositories/lesson.repository.js';
import { AppError } from '../utils/apiResponse.js';

/**
 * Video Service - YouTube Video Streaming & Playlist Embedding Logic
 */
export class VideoService {
  /**
   * Extract YouTube Video ID from standard, shortened, and embedded URLs
   */
  extractYoutubeId(url) {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();

    // Direct ID check (11 characters alphanum + _ -)
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
      return cleanUrl;
    }

    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = cleanUrl.match(regExp);
    return match ? match[1] : null;
  }

  /**
   * Extract YouTube Playlist ID
   */
  extractPlaylistId(url) {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();

    const regExp = /[?&]list=([^#\&\?]+)/i;
    const match = cleanUrl.match(regExp);
    return match ? match[1] : null;
  }

  /**
   * Generate clean privacy-enhanced embed URL
   */
  generateEmbedUrl(videoUrl, playlistUrl = null) {
    const playlistId = this.extractPlaylistId(playlistUrl || videoUrl);
    const youtubeId = this.extractYoutubeId(videoUrl);

    if (playlistId && !youtubeId) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}`;
    }

    if (youtubeId) {
      if (playlistId) {
        return `https://www.youtube-nocookie.com/embed/${youtubeId}?list=${playlistId}&rel=0`;
      }
      return `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`;
    }

    return videoUrl || '';
  }

  /**
   * Get all videos
   */
  async getVideos(filters = {}) {
    const videos = await videoRepository.findAll(filters);
    return videos.map((v) => ({
      ...v,
      embedUrl: this.generateEmbedUrl(v.videoUrl, v.playlistUrl),
    }));
  }

  /**
   * Get video by ID
   */
  async getVideoById(id) {
    const video = await videoRepository.findById(id);
    if (!video) {
      throw new AppError('Video not found', 404);
    }
    return {
      ...video,
      embedUrl: this.generateEmbedUrl(video.videoUrl, video.playlistUrl),
    };
  }

  /**
   * Get videos associated with a lesson
   */
  async getVideosByLesson(lessonId) {
    const videos = await videoRepository.findByLessonId(lessonId);
    return videos.map((v) => ({
      ...v,
      embedUrl: this.generateEmbedUrl(v.videoUrl, v.playlistUrl),
    }));
  }

  /**
   * Create and associate a video with a lesson
   */
  async createVideo(data) {
    if (!data.title) {
      throw new AppError('Video title is required', 400);
    }
    if (!data.videoUrl && !data.playlistUrl) {
      throw new AppError('A valid YouTube video URL or playlist URL is required', 400);
    }

    const youtubeId = this.extractYoutubeId(data.videoUrl);
    const playlistId = this.extractPlaylistId(data.playlistUrl || data.videoUrl);

    let thumbnailUrl = data.thumbnailUrl;
    if (!thumbnailUrl && youtubeId) {
      thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }

    const video = await videoRepository.create({
      lessonId: data.lessonId || null,
      title: data.title,
      videoUrl: data.videoUrl || '',
      youtubeId: youtubeId || '',
      playlistUrl: data.playlistUrl || '',
      thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      durationSeconds: Number(data.durationSeconds || 0),
      videoProvider: data.videoProvider || 'youtube',
      quality: data.quality || '1080p',
      order: Number(data.order || 0),
    });

    // If attached to a lesson, also keep lesson video_url in sync
    if (data.lessonId) {
      try {
        await lessonRepository.update(data.lessonId, { videoUrl: data.videoUrl });
      } catch (err) {
        console.warn('Sync lesson videoUrl error:', err.message);
      }
    }

    return {
      ...video,
      embedUrl: this.generateEmbedUrl(video.videoUrl, video.playlistUrl),
    };
  }

  /**
   * Update video
   */
  async updateVideo(id, data) {
    const existing = await videoRepository.findById(id);
    if (!existing) {
      throw new AppError('Video not found', 404);
    }

    let youtubeId = data.videoUrl ? this.extractYoutubeId(data.videoUrl) : existing.youtubeId;
    let playlistId = (data.playlistUrl || data.videoUrl) ? this.extractPlaylistId(data.playlistUrl || data.videoUrl) : existing.playlistUrl;

    let thumbnailUrl = data.thumbnailUrl !== undefined ? data.thumbnailUrl : existing.thumbnailUrl;
    if (!thumbnailUrl && youtubeId) {
      thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }

    const updated = await videoRepository.update(id, {
      ...data,
      youtubeId,
      thumbnailUrl,
    });

    return {
      ...updated,
      embedUrl: this.generateEmbedUrl(updated.videoUrl, updated.playlistUrl),
    };
  }

  /**
   * Delete video
   */
  async deleteVideo(id) {
    const existing = await videoRepository.findById(id);
    if (!existing) {
      throw new AppError('Video not found', 404);
    }

    await videoRepository.delete(id);
    return true;
  }
}

export const videoService = new VideoService();
