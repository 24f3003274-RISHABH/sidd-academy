import mongoose from 'mongoose';
import Course from '../models/Course.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';
import { mockData } from '../data/mockStore.js';

const populateMockCourse = (course) => {
  const c = { ...course };
  c.subjects = mockData.subjects
    .filter(s => s.course === course._id)
    .map(s => {
      const subj = { ...s };
      subj.chapters = mockData.chapters
        .filter(ch => ch.subject === s._id)
        .map(ch => {
          const chap = { ...ch };
          chap.dailyClasses = mockData.dailyClasses.filter(dc => dc.chapter === ch._id);
          return chap;
        });
      return subj;
    });
  return c;
};

export const getAllCourses = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const query = { isPublished: true };
      if (req.query.search) {
        query.$or = [
          { title: { $regex: req.query.search, $options: 'i' } },
          { description: { $regex: req.query.search, $options: 'i' } },
        ];
      }
      if (req.query.level) {
        query.level = req.query.level;
      }
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      const total = await Course.countDocuments(query);
      const courses = await Course.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
      
      return sendSuccess(res, 200, 'Courses fetched successfully', {
        courses,
        total,
        page,
        pages: Math.ceil(total / limit)
      });
    }

    // In-memory fallback
    let filtered = mockData.courses.filter(c => c.isPublished);
    if (req.query.search) {
      const s = req.query.search.toLowerCase();
      filtered = filtered.filter(c => c.title.toLowerCase().includes(s) || c.description.toLowerCase().includes(s));
    }
    if (req.query.level) {
      filtered = filtered.filter(c => c.level === req.query.level);
    }
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const total = filtered.length;
    const courses = filtered.slice((page - 1) * limit, page * limit);

    return sendSuccess(res, 200, 'Courses fetched successfully', {
      courses,
      total,
      page,
      pages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const course = await Course.findById(req.params.id).populate('subjects');
      if (!course) {
        throw new AppError('Course not found', 404);
      }
      return sendSuccess(res, 200, 'Course fetched successfully', { course });
    }

    const rawCourse = mockData.courses.find(c => c._id === req.params.id);
    if (!rawCourse) {
      throw new AppError('Course not found', 404);
    }
    const course = populateMockCourse(rawCourse);
    return sendSuccess(res, 200, 'Course fetched successfully', { course });
  } catch (error) {
    next(error);
  }
};

export const getCourseContent = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const course = await Course.findById(req.params.id).populate({
        path: 'subjects',
        populate: {
          path: 'chapters',
          populate: {
            path: 'dailyClasses'
          }
        }
      });
      
      if (!course) {
        throw new AppError('Course not found', 404);
      }
      
      const isPurchased = req.user.purchasedCourses && req.user.purchasedCourses.includes(course._id.toString());
      const isAdmin = req.user.role === 'admin';
      
      if (!isPurchased && !isAdmin) {
        throw new AppError('Access denied. Please purchase the course.', 403);
      }
      
      return sendSuccess(res, 200, 'Course content fetched successfully', { course });
    }

    const rawCourse = mockData.courses.find(c => c._id === req.params.id);
    if (!rawCourse) {
      throw new AppError('Course not found', 404);
    }
    const course = populateMockCourse(rawCourse);
    return sendSuccess(res, 200, 'Course content fetched successfully', { course });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const course = await Course.create(req.body);
      return sendSuccess(res, 201, 'Course created successfully', { course });
    }
    const newCourse = {
      _id: `course_${Date.now()}`,
      ...req.body,
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true,
      subjects: [],
      createdAt: new Date()
    };
    mockData.courses.unshift(newCourse);
    sendSuccess(res, 201, 'Course created successfully', { course: newCourse });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!course) {
        throw new AppError('Course not found', 404);
      }
      return sendSuccess(res, 200, 'Course updated successfully', { course });
    }
    const idx = mockData.courses.findIndex(c => c._id === req.params.id);
    if (idx === -1) {
      throw new AppError('Course not found', 404);
    }
    mockData.courses[idx] = { ...mockData.courses[idx], ...req.body };
    sendSuccess(res, 200, 'Course updated successfully', { course: mockData.courses[idx] });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const course = await Course.findByIdAndDelete(req.params.id);
      if (!course) {
        throw new AppError('Course not found', 404);
      }
      return sendSuccess(res, 200, 'Course deleted successfully');
    }
    const idx = mockData.courses.findIndex(c => c._id === req.params.id);
    if (idx === -1) {
      throw new AppError('Course not found', 404);
    }
    mockData.courses.splice(idx, 1);
    sendSuccess(res, 200, 'Course deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const uploadCourseThumbnail = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Please upload a file', 400);
    }
    const fileUrl = `/uploads/images/${req.file.filename}`;
    if (mongoose.connection.readyState === 1) {
      const course = await Course.findByIdAndUpdate(req.params.id, { thumbnail: fileUrl }, { new: true });
      if (!course) {
        throw new AppError('Course not found', 404);
      }
      return sendSuccess(res, 200, 'Thumbnail uploaded successfully', { course });
    }
    const course = mockData.courses.find(c => c._id === req.params.id);
    if (!course) throw new AppError('Course not found', 404);
    course.thumbnail = fileUrl;
    sendSuccess(res, 200, 'Thumbnail uploaded successfully', { course });
  } catch (error) {
    next(error);
  }
};

