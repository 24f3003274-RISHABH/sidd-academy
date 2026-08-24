import Subject from '../models/Subject.model.js';
import Course from '../models/Course.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';

export const getSubjectsByCourse = async (req, res, next) => {
  try {
    const subjects = await Subject.find({ course: req.params.courseId }).populate('chapters').sort({ order: 1 });
    sendSuccess(res, 200, 'Subjects fetched successfully', { subjects });
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    const subject = await Subject.create(req.body);
    await Course.findByIdAndUpdate(subject.course, { $push: { subjects: subject._id } });
    sendSuccess(res, 201, 'Subject created successfully', { subject });
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!subject) {
      throw new AppError('Subject not found', 404);
    }
    sendSuccess(res, 200, 'Subject updated successfully', { subject });
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      throw new AppError('Subject not found', 404);
    }
    await Course.findByIdAndUpdate(subject.course, { $pull: { subjects: subject._id } });
    sendSuccess(res, 200, 'Subject deleted successfully');
  } catch (error) {
    next(error);
  }
};
