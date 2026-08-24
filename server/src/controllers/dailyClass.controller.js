import mongoose from 'mongoose';
import DailyClass from '../models/DailyClass.model.js';
import Chapter from '../models/Chapter.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';
import { mockData } from '../data/mockStore.js';

export const getClassesByChapter = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let classes = await DailyClass.find({ chapter: req.params.chapterId }).sort({ classDate: 1, order: 1 }).lean();
      
      classes = classes.map((c) => {
        if (c.isProtected && !req.user) {
          delete c.videoUrl;
          delete c.youtubePlaylistUrl;
        }
        return c;
      });

      return sendSuccess(res, 200, 'Classes fetched successfully', { classes });
    }

    let classes = mockData.dailyClasses.filter(dc => dc.chapter === req.params.chapterId).sort((a, b) => (a.order || 0) - (b.order || 0));
    classes = classes.map((c) => {
      const copy = { ...c };
      if (copy.isProtected && !req.user) {
        delete copy.videoUrl;
        delete copy.youtubePlaylistUrl;
      }
      return copy;
    });
    return sendSuccess(res, 200, 'Classes fetched successfully', { classes });
  } catch (error) {
    next(error);
  }
};

export const getDailyClassById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const dailyClass = await DailyClass.findById(req.params.id).lean();
      if (!dailyClass) {
        throw new AppError('Class not found', 404);
      }
      if (dailyClass.isProtected && !req.user && !dailyClass.isFree) {
        throw new AppError('Unauthorized access to protected class', 401);
      }
      return sendSuccess(res, 200, 'Class fetched successfully', { dailyClass });
    }

    const dailyClass = mockData.dailyClasses.find(dc => dc._id === req.params.id);
    if (!dailyClass) {
      throw new AppError('Class not found', 404);
    }
    if (dailyClass.isProtected && !req.user && !dailyClass.isFree) {
      throw new AppError('Unauthorized access to protected class', 401);
    }
    return sendSuccess(res, 200, 'Class fetched successfully', { dailyClass });
  } catch (error) {
    next(error);
  }
};

export const createClass = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const dailyClass = await DailyClass.create(req.body);
      await Chapter.findByIdAndUpdate(dailyClass.chapter, { $push: { dailyClasses: dailyClass._id } });
      return sendSuccess(res, 201, 'Class created successfully', { dailyClass });
    }

    const newClass = {
      _id: `class_${Date.now()}`,
      ...req.body,
      isFree: req.body.isFree !== undefined ? req.body.isFree : false,
      isProtected: req.body.isProtected !== undefined ? req.body.isProtected : true,
      order: req.body.order || mockData.dailyClasses.length + 1
    };
    mockData.dailyClasses.push(newClass);
    return sendSuccess(res, 201, 'Class created successfully', { dailyClass: newClass });
  } catch (error) {
    next(error);
  }
};

export const updateClass = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const dailyClass = await DailyClass.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!dailyClass) {
        throw new AppError('Class not found', 404);
      }
      return sendSuccess(res, 200, 'Class updated successfully', { dailyClass });
    }

    const idx = mockData.dailyClasses.findIndex(dc => dc._id === req.params.id);
    if (idx === -1) throw new AppError('Class not found', 404);
    mockData.dailyClasses[idx] = { ...mockData.dailyClasses[idx], ...req.body };
    return sendSuccess(res, 200, 'Class updated successfully', { dailyClass: mockData.dailyClasses[idx] });
  } catch (error) {
    next(error);
  }
};

export const deleteClass = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const dailyClass = await DailyClass.findByIdAndDelete(req.params.id);
      if (!dailyClass) {
        throw new AppError('Class not found', 404);
      }
      await Chapter.findByIdAndUpdate(dailyClass.chapter, { $pull: { dailyClasses: dailyClass._id } });
      return sendSuccess(res, 200, 'Class deleted successfully');
    }

    const idx = mockData.dailyClasses.findIndex(dc => dc._id === req.params.id);
    if (idx === -1) throw new AppError('Class not found', 404);
    mockData.dailyClasses.splice(idx, 1);
    return sendSuccess(res, 200, 'Class deleted successfully');
  } catch (error) {
    next(error);
  }
};

