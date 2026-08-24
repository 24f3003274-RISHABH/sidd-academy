import Course from '../models/Course.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';

export const getAllCourses = async (req, res, next) => {
  try {
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
    
    sendSuccess(res, 200, 'Courses fetched successfully', {
      courses,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('subjects');
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    sendSuccess(res, 200, 'Course fetched successfully', { course });
  } catch (error) {
    next(error);
  }
};

export const getCourseContent = async (req, res, next) => {
  try {
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
    
    const isPurchased = req.user.purchasedCourses.includes(course._id.toString());
    const isAdmin = req.user.role === 'admin';
    
    if (!isPurchased && !isAdmin) {
      throw new AppError('Access denied. Please purchase the course.', 403);
    }
    
    sendSuccess(res, 200, 'Course content fetched successfully', { course });
  } catch (error) {
    next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    sendSuccess(res, 201, 'Course created successfully', { course });
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    sendSuccess(res, 200, 'Course updated successfully', { course });
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
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
    const course = await Course.findByIdAndUpdate(req.params.id, { thumbnail: fileUrl }, { new: true });
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    sendSuccess(res, 200, 'Thumbnail uploaded successfully', { course });
  } catch (error) {
    next(error);
  }
};
