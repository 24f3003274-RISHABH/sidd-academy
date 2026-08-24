import DailyClass from '../models/DailyClass.model.js';
import Chapter from '../models/Chapter.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';

export const getClassesByChapter = async (req, res, next) => {
  try {
    let classes = await DailyClass.find({ chapter: req.params.chapterId }).sort({ classDate: 1, order: 1 }).lean();
    
    classes = classes.map((c) => {
      if (c.isProtected && !req.user) {
        delete c.videoUrl;
        delete c.youtubePlaylistUrl;
      }
      return c;
    });

    sendSuccess(res, 200, 'Classes fetched successfully', { classes });
  } catch (error) {
    next(error);
  }
};

export const getDailyClassById = async (req, res, next) => {
  try {
    const dailyClass = await DailyClass.findById(req.params.id).lean();
    if (!dailyClass) {
      throw new AppError('Class not found', 404);
    }
    if (dailyClass.isProtected && !req.user && !dailyClass.isFree) {
      throw new AppError('Unauthorized access to protected class', 401);
    }
    sendSuccess(res, 200, 'Class fetched successfully', { dailyClass });
  } catch (error) {
    next(error);
  }
};

export const createClass = async (req, res, next) => {
  try {
    const dailyClass = await DailyClass.create(req.body);
    await Chapter.findByIdAndUpdate(dailyClass.chapter, { $push: { dailyClasses: dailyClass._id } });
    sendSuccess(res, 201, 'Class created successfully', { dailyClass });
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (req, res, next) => {
  try {
    const dailyClass = await DailyClass.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dailyClass) {
      throw new AppError('Class not found', 404);
    }
    sendSuccess(res, 200, 'Class updated successfully', { dailyClass });
  } catch (error) {
    next(error);
  }
};

export const deleteClass = async (req, res, next) => {
  try {
    const dailyClass = await DailyClass.findByIdAndDelete(req.params.id);
    if (!dailyClass) {
      throw new AppError('Class not found', 404);
    }
    await Chapter.findByIdAndUpdate(dailyClass.chapter, { $pull: { dailyClasses: dailyClass._id } });
    sendSuccess(res, 200, 'Class deleted successfully');
  } catch (error) {
    next(error);
  }
};
