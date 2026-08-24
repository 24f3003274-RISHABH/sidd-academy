import Chapter from '../models/Chapter.model.js';
import Subject from '../models/Subject.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';

export const getChaptersBySubject = async (req, res, next) => {
  try {
    const chapters = await Chapter.find({ subject: req.params.subjectId }).sort({ order: 1 });
    sendSuccess(res, 200, 'Chapters fetched successfully', { chapters });
  } catch (error) {
    next(error);
  }
};

export const createChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.create(req.body);
    await Subject.findByIdAndUpdate(chapter.subject, { $push: { chapters: chapter._id } });
    sendSuccess(res, 201, 'Chapter created successfully', { chapter });
  } catch (error) {
    next(error);
  }
};

export const updateChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!chapter) {
      throw new AppError('Chapter not found', 404);
    }
    sendSuccess(res, 200, 'Chapter updated successfully', { chapter });
  } catch (error) {
    next(error);
  }
};

export const deleteChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findByIdAndDelete(req.params.id);
    if (!chapter) {
      throw new AppError('Chapter not found', 404);
    }
    await Subject.findByIdAndUpdate(chapter.subject, { $pull: { chapters: chapter._id } });
    sendSuccess(res, 200, 'Chapter deleted successfully');
  } catch (error) {
    next(error);
  }
};
