import { videoService } from '../services/video.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * Controller for YouTube Video & Playlist Streaming Management
 */

/**
 * GET /api/v1/videos
 * List all videos with optional filtering
 */
export const getAllVideos = async (req, res, next) => {
  try {
    const { lessonId, courseId, provider, search, limit = 50, page = 1 } = req.query;
    const videos = await videoService.getVideos({ lessonId, courseId, provider, search, limit, page });

    return sendSuccess(res, 200, 'Videos retrieved successfully', {
      videos,
      total: videos.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/videos/:id
 * Retrieve video stream details by ID
 */
export const getVideoById = async (req, res, next) => {
  try {
    const video = await videoService.getVideoById(req.params.id);
    return sendSuccess(res, 200, 'Video details retrieved successfully', { video });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/videos/lesson/:lessonId
 * Retrieve videos associated with a specific lesson
 */
export const getVideosByLesson = async (req, res, next) => {
  try {
    const videos = await videoService.getVideosByLesson(req.params.lessonId);
    return sendSuccess(res, 200, 'Lesson videos retrieved successfully', { videos });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/videos
 * Admin create/associate a video with a lesson
 */
export const createVideo = async (req, res, next) => {
  try {
    const video = await videoService.createVideo(req.body);
    return sendSuccess(res, 201, 'Video created and associated successfully', { video });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/videos/:id
 * Admin update video details
 */
export const updateVideo = async (req, res, next) => {
  try {
    const video = await videoService.updateVideo(req.params.id, req.body);
    return sendSuccess(res, 200, 'Video updated successfully', { video });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/videos/:id
 * Admin remove video
 */
export const deleteVideo = async (req, res, next) => {
  try {
    await videoService.deleteVideo(req.params.id);
    return sendSuccess(res, 200, 'Video removed successfully');
  } catch (error) {
    next(error);
  }
};
