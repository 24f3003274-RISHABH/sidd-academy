import mongoose from 'mongoose';
import Subject from '../models/Subject.model.js';
import Course from '../models/Course.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';
import { mockData } from '../data/mockStore.js';

export const getSubjectsByCourse = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const subjects = await Subject.find({ course: req.params.courseId }).populate('chapters').sort({ order: 1 });
      return sendSuccess(res, 200, 'Subjects fetched successfully', { subjects });
    }

    const subjects = mockData.subjects
      .filter(s => s.course === req.params.courseId)
      .map(s => ({
        ...s,
        chapters: mockData.chapters.filter(ch => ch.subject === s._id)
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    return sendSuccess(res, 200, 'Subjects fetched successfully', { subjects });
  } catch (error) {
    next(error);
  }
};

export const createSubject = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const subject = await Subject.create(req.body);
      await Course.findByIdAndUpdate(subject.course, { $push: { subjects: subject._id } });
      return sendSuccess(res, 201, 'Subject created successfully', { subject });
    }

    const newSubj = {
      _id: `subj_${Date.now()}`,
      ...req.body,
      chapters: [],
      order: req.body.order || mockData.subjects.length + 1
    };
    mockData.subjects.push(newSubj);
    return sendSuccess(res, 201, 'Subject created successfully', { subject: newSubj });
  } catch (error) {
    next(error);
  }
};

export const updateSubject = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!subject) {
        throw new AppError('Subject not found', 404);
      }
      return sendSuccess(res, 200, 'Subject updated successfully', { subject });
    }

    const idx = mockData.subjects.findIndex(s => s._id === req.params.id);
    if (idx === -1) throw new AppError('Subject not found', 404);
    mockData.subjects[idx] = { ...mockData.subjects[idx], ...req.body };
    return sendSuccess(res, 200, 'Subject updated successfully', { subject: mockData.subjects[idx] });
  } catch (error) {
    next(error);
  }
};

export const deleteSubject = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const subject = await Subject.findByIdAndDelete(req.params.id);
      if (!subject) {
        throw new AppError('Subject not found', 404);
      }
      await Course.findByIdAndUpdate(subject.course, { $pull: { subjects: subject._id } });
      return sendSuccess(res, 200, 'Subject deleted successfully');
    }

    const idx = mockData.subjects.findIndex(s => s._id === req.params.id);
    if (idx === -1) throw new AppError('Subject not found', 404);
    mockData.subjects.splice(idx, 1);
    return sendSuccess(res, 200, 'Subject deleted successfully');
  } catch (error) {
    next(error);
  }
};

