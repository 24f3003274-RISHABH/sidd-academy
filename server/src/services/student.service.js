import { studentRepository } from '../repositories/student.repository.js';
import { authRepository } from '../repositories/auth.repository.js';
import { AppError } from '../utils/apiResponse.js';
import { HTTP_STATUS } from '../constants/index.js';

/**
 * Student Service
 * Coordinates student dashboard data aggregation, course enrollments, notes, and learning progress
 */
export class StudentService {
  /**
   * Get aggregated dashboard payload for the student
   */
  async getDashboardOverview(userId) {
    if (!userId) {
      throw new AppError('User authentication required', HTTP_STATUS.UNAUTHORIZED);
    }

    const user = await authRepository.findById(userId);
    if (!user) {
      throw new AppError('Student profile not found', HTTP_STATUS.NOT_FOUND);
    }

    // Parallel data fetching for high performance
    const [enrolledCourses, purchasedNotes, recentClasses, availableCourses, recentActivities] = await Promise.all([
      studentRepository.getEnrolledCourses(userId),
      studentRepository.getPurchasedNotes(userId),
      studentRepository.getRecentClasses(userId),
      studentRepository.getAvailableCourses(userId, 4),
      studentRepository.getRecentActivities(userId),
    ]);

    // Calculate learning summary stats
    const totalEnrolled = enrolledCourses.length;
    const totalNotes = purchasedNotes.length;
    const completedCoursesCount = enrolledCourses.filter(c => c.progressPercentage >= 100).length;
    const totalLessonsAvailable = enrolledCourses.reduce((acc, c) => acc + (c.totalLessons || 0), 0);
    const totalLessonsCompleted = enrolledCourses.reduce((acc, c) => acc + (c.completedLessons || 0), 0);

    const overallProgress = totalLessonsAvailable > 0
      ? Math.round((totalLessonsCompleted / totalLessonsAvailable) * 100)
      : (totalEnrolled > 0 ? 30 : 0);

    // Identify last active course to offer direct "Continue Learning" shortcut
    const lastActiveCourse = enrolledCourses.length > 0 ? enrolledCourses[0] : null;

    return {
      profile: {
        id: user.id || user._id,
        _id: user.id || user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        avatar: user.avatar || '',
        role: user.role,
        memberSince: user.created_at || user.createdAt,
      },
      stats: {
        enrolledCourses: totalEnrolled,
        purchasedNotes: totalNotes,
        completedCourses: completedCoursesCount,
        totalLessonsCompleted,
        totalLessonsAvailable,
        overallProgress,
      },
      continueLearning: lastActiveCourse,
      enrolledCourses,
      purchasedNotes,
      recentClasses,
      availableCourses,
      recentActivities,
    };
  }

  /**
   * Get detailed enrolled courses
   */
  async getEnrolledCourses(userId) {
    return studentRepository.getEnrolledCourses(userId);
  }

  /**
   * Get detailed purchased notes
   */
  async getPurchasedNotes(userId) {
    return studentRepository.getPurchasedNotes(userId);
  }

  /**
   * Get course progress state
   */
  async getCourseProgress(userId, courseId) {
    return studentRepository.getCourseProgress(userId, courseId);
  }

  /**
   * Mark lesson progress
   */
  async updateLessonProgress(userId, { courseId, lessonId, isCompleted = true }) {
    if (!courseId || !lessonId) {
      throw new AppError('courseId and lessonId are required', HTTP_STATUS.BAD_REQUEST);
    }
    return studentRepository.toggleLessonProgress(userId, courseId, lessonId, isCompleted);
  }
}

export const studentService = new StudentService();
export default studentService;
