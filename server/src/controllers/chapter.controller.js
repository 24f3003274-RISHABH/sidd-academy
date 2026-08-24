import mongoose from 'mongoose';
import Chapter from '../models/Chapter.model.js';
import Subject from '../models/Subject.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';
import { mockData } from '../data/mockStore.js';

export const getChaptersBySubject = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const chapters = await Chapter.find({ subject: req.params.subjectId }).sort({ order: 1 });
      return sendSuccess(res, 200, 'Chapters fetched successfully', { chapters });
    }

    const chapters = mockData.chapters
      .filter(ch => ch.subject === req.params.subjectId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return sendSuccess(res, 200, 'Chapters fetched successfully', { chapters });
  } catch (error) {
    next(error);
  }
};

export const createChapter = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const chapter = await Chapter.create(req.body);
      await Subject.findByIdAndUpdate(chapter.subject, { $push: { chapters: chapter._id } });
      return sendSuccess(res, 201, 'Chapter created successfully', { chapter });
    }

    const newChapter = {
      _id: `chap_${Date.now()}`,
      ...req.body,
      dailyClasses: [],
      order: req.body.order || mockData.chapters.length + 1
    };
    mockData.chapters.push(newChapter);
    return sendSuccess(res, 201, 'Chapter created successfully', { chapter: newChapter });
  } catch (error) {
    next(error);
  }
};

export const updateChapter = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!chapter) {
        throw new AppError('Chapter not found', 404);
      }
      return sendSuccess(res, 200, 'Chapter updated successfully', { chapter });
    }

    const idx = mockData.chapters.findIndex(ch => ch._id === req.params.id);
    if (idx === -1) throw new AppError('Chapter not found', 404);
    mockData.chapters[idx] = { ...mockData.chapters[idx], ...req.body };
    return sendSuccess(res, 200, 'Chapter updated successfully', { chapter: mockData.chapters[idx] });
  } catch (error) {
    next(error);
  }
};

export const deleteChapter = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const chapter = await Chapter.findByIdAndDelete(req.params.id);
      if (!chapter) {
        throw new AppError('Chapter not found', 404);
      }
      await Subject.findByIdAndUpdate(chapter.subject, { $pull: { chapters: chapter._id } });
      return sendSuccess(res, 200, 'Chapter deleted successfully');
    }

    const idx = mockData.chapters.findIndex(ch => ch._id === req.params.id);
    if (idx === -1) throw new AppError('Chapter not found', 404);
    mockData.chapters.splice(idx, 1);
    return sendSuccess(res, 200, 'Chapter deleted successfully');
  } catch (error) {
    next(error);
  }
};

