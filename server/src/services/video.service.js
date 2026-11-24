import { videoRepository } from '../repositories/video.repository.js';
import { lessonRepository } from '../repositories/lesson.repository.js';
import { AppError } from '../utils/apiResponse.js';

/**
 * Video Service - YouTube Video Streaming & Playlist Embedding Logic
 */
export class VideoService {
  /**
   * Extract YouTube Video ID from standard, shortened, shorts, and embedded URLs
   */
  extractYoutubeId(url) {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();

    // Direct ID check (11 characters alphanum + _ -)
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
      return cleanUrl;
    }

    // Handles:
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://www.youtube.com/embed/VIDEO_ID
    // https://www.youtube.com/shorts/VIDEO_ID
    // https://www.youtube.com/v/VIDEO_ID
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = cleanUrl.match(regExp);
    return match ? match[1] : null;
  }

  /**
   * Extract YouTube Playlist ID from playlist URL, watch URL with list=, or bare PL... ID
   */
  extractPlaylistId(url) {
    if (!url || typeof url !== 'string') return null;
    const cleanUrl = url.trim();

    if (/^PL[a-zA-Z0-9_-]{8,}$/.test(cleanUrl)) {
      return cleanUrl;
    }

    const regExp = /[?&]list=([^#\&\?\s]+)/i;
    const match = cleanUrl.match(regExp);
    return match ? match[1] : null;
  }

  /**
   * Convert MM:SS or HH:MM:SS duration string to seconds
   */
  parseDurationToSeconds(durationStr) {
    if (!durationStr || typeof durationStr !== 'string') return 1800;
    const parts = durationStr.trim().split(':').map(Number);
    if (parts.some(isNaN)) return 1800;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return Number(durationStr) || 1800;
  }

  /**
   * Fetch all videos in exact order from a YouTube Playlist URL (or list of YouTube Video URLs)
   */
  async fetchPlaylistMetadata(input) {
    if (!input || typeof input !== 'string' || !input.trim()) {
      throw new AppError('Please provide a valid YouTube Playlist URL or video links', 400);
    }

    const raw = input.trim();
    const playlistId = this.extractPlaylistId(raw);

    if (playlistId) {
      const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
      const res = await fetch(playlistUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Cookie: 'CONSENT=YES+cb.20210328-17-p0.en+FX+999',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!res.ok) {
        throw new AppError(`Failed to fetch YouTube playlist (HTTP ${res.status})`, 400);
      }

      const html = await res.text();
      const marker = 'var ytInitialData = ';
      const idx = html.indexOf(marker);
      if (idx === -1) {
        throw new AppError('Could not parse YouTube playlist data from URL', 400);
      }

      const sub = html.slice(idx + marker.length);
      const endIdx = sub.indexOf(';</script>');
      const data = JSON.parse(sub.slice(0, endIdx));

      const rawTitle =
        data.metadata?.playlistMetadataRenderer?.title ||
        (html.match(/<title>(.*?)<\/title>/)?.[1] || '').replace(/\s*-\s*YouTube$/i, '') ||
        'Imported YouTube Playlist Course';
      const playlistDescription =
        data.metadata?.playlistMetadataRenderer?.description ||
        `Complete structured video lecture series imported from YouTube Playlist "${rawTitle}" in exact playlist order.`;

      const videos = [];
      const seen = new Set();

      const walk = (node) => {
        if (!node || typeof node !== 'object') return;

        if (node.lockupViewModel) {
          const lvm = node.lockupViewModel;
          const vid = lvm.contentId;
          const title = lvm.metadata?.lockupMetadataViewModel?.title?.content;
          if (vid && /^[a-zA-Z0-9_-]{11}$/.test(vid) && title && !seen.has(vid)) {
            seen.add(vid);
            const imgJson = JSON.stringify(lvm.contentImage || {});
            const durMatch = imgJson.match(/"text":"(\d+:\d+(?::\d+)?)"/);
            const duration = durMatch ? durMatch[1] : '30:00';
            videos.push({
              order: videos.length + 1,
              videoId: vid,
              youtubeId: vid,
              title: title.trim(),
              duration,
              durationSeconds: this.parseDurationToSeconds(duration),
              videoUrl: `https://www.youtube.com/watch?v=${vid}`,
              playlistUrl,
              thumbnailUrl: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
              isFree: videos.length < 2,
            });
          }
        } else if (node.playlistVideoRenderer) {
          const pvr = node.playlistVideoRenderer;
          const vid = pvr.videoId;
          const title = pvr.title?.runs?.[0]?.text || pvr.title?.simpleText;
          if (vid && /^[a-zA-Z0-9_-]{11}$/.test(vid) && title && !seen.has(vid)) {
            seen.add(vid);
            const duration = pvr.lengthText?.simpleText || '30:00';
            videos.push({
              order: videos.length + 1,
              videoId: vid,
              youtubeId: vid,
              title: title.trim(),
              duration,
              durationSeconds: this.parseDurationToSeconds(duration),
              videoUrl: `https://www.youtube.com/watch?v=${vid}`,
              playlistUrl,
              thumbnailUrl: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
              isFree: videos.length < 2,
            });
          }
        }

        for (const key of Object.keys(node)) {
          walk(node[key]);
        }
      };

      walk(data);

      if (videos.length === 0) {
        throw new AppError('No public videos found in the provided YouTube playlist', 400);
      }

      return {
        playlistId,
        playlistUrl,
        title: rawTitle.trim(),
        description: playlistDescription.trim(),
        thumbnailUrl: videos[0]?.thumbnailUrl || '',
        videoCount: videos.length,
        videos,
      };
    }

    // Fallback: Parse one or more individual YouTube video URLs separated by newlines or commas
    const lines = raw
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean);
    const videos = [];
    const seen = new Set();

    for (const line of lines) {
      const vid = this.extractYoutubeId(line);
      if (vid && !seen.has(vid)) {
        seen.add(vid);
        let title = `Lecture ${videos.length + 1}`;
        try {
          const oRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vid}&format=json`);
          if (oRes.ok) {
            const oData = await oRes.json();
            if (oData.title) title = oData.title.trim();
          }
        } catch {
          // keep fallback title
        }
        videos.push({
          order: videos.length + 1,
          videoId: vid,
          youtubeId: vid,
          title,
          duration: '30:00',
          durationSeconds: 1800,
          videoUrl: `https://www.youtube.com/watch?v=${vid}`,
          playlistUrl: '',
          thumbnailUrl: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
          isFree: videos.length < 2,
        });
      }
    }

    if (videos.length === 0) {
      throw new AppError('Could not extract any valid YouTube playlist or video IDs from input', 400);
    }

    return {
      playlistId: null,
      playlistUrl: '',
      title: videos[0]?.title || 'Imported YouTube Video Series',
      description: `Video series containing ${videos.length} lecture(s).`,
      thumbnailUrl: videos[0]?.thumbnailUrl || '',
      videoCount: videos.length,
      videos,
    };
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
   * Create a video stream entry
   */
  async createVideo(data) {
    if (!data.title || !data.title.trim()) {
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
      courseId: data.courseId || null,
      subjectId: data.subjectId || null,
      chapterId: data.chapterId || null,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      videoUrl: data.videoUrl ? data.videoUrl.trim() : '',
      youtubeId: youtubeId || '',
      playlistUrl: data.playlistUrl ? data.playlistUrl.trim() : '',
      thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
      durationSeconds: Number(data.durationSeconds || 0),
      videoProvider: data.videoProvider || 'youtube',
      quality: data.quality || '1080p',
      order: Number(data.order || 0),
      isFree: data.isFree === true || data.isFree === 'true',
      isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
    });

    // If attached to a lesson, also keep lesson video_url in sync if possible
    if (data.lessonId && data.videoUrl) {
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
   * Update video details
   */
  async updateVideo(id, data) {
    const existing = await videoRepository.findById(id);
    if (!existing) {
      throw new AppError('Video not found', 404);
    }

    let youtubeId = data.videoUrl !== undefined ? this.extractYoutubeId(data.videoUrl) : existing.youtubeId;
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
export default videoService;
