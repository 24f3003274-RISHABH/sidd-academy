import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getStudentCourses } from '../../api/studentApi';
import StudentLayout from '../../components/student/StudentLayout';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import {
  FiBook,
  FiPlayCircle,
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiCompass,
  FiLayers,
  FiAlertCircle,
} from 'react-icons/fi';

const MyCoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'IN_PROGRESS' | 'COMPLETED'

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudentCourses();
      const courseList = res.data?.data?.courses || res.data?.courses || [];
      setCourses(courseList);
    } catch (err) {
      console.error('Failed to load enrolled courses:', err);
      setError('Unable to load your enrolled courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  // Filtered and searched courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.instructor && course.instructor.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (course.category && course.category.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'COMPLETED') {
        return course.progressPercentage >= 100;
      }
      if (statusFilter === 'IN_PROGRESS') {
        return course.progressPercentage < 100;
      }
      return true;
    });
  }, [courses, searchQuery, statusFilter]);

  return (
    <StudentLayout
      title="My Enrolled Courses"
      subtitle="Access your active classroom batches, recorded lecture series, and track syllabus progress."
      actions={
        <Link to="/courses" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FiCompass /> Browse More Courses
        </Link>
      }
    >
      {/* Search & Filter Toolbar */}
      <div
        className="card-glass"
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search enrolled courses by title or instructor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', padding: '0.25rem', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', fontSize: '0.8rem' }}
          >
            All ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`btn btn-sm ${statusFilter === 'IN_PROGRESS' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', fontSize: '0.8rem' }}
          >
            In Progress
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            className={`btn btn-sm ${statusFilter === 'COMPLETED' ? 'btn-primary' : 'btn-outline'}`}
            style={{ border: 'none', fontSize: '0.8rem' }}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <SkeletonCard height="280px" count={3} />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          className="card-glass"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <FiAlertCircle size={40} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{error}</h3>
          <button onClick={fetchEnrolledCourses} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && courses.length === 0 && (
        <div
          className="card-glass"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(108, 99, 255, 0.15)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              margin: '0 auto 1.5rem auto',
            }}
          >
            <FiBook />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            You haven't enrolled in any courses yet
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
            Start your learning journey with our top courses taught by Siddhant Pandey & आकाश सर at SID ACADEMY.
          </p>
          <Link to="/courses" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiCompass /> Browse Course Catalog
          </Link>
        </div>
      )}

      {/* No search results */}
      {!loading && !error && courses.length > 0 && filteredCourses.length === 0 && (
        <div
          className="card-glass"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderRadius: '16px',
          }}
        >
          <FiSearch size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>No matching enrolled courses</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Try adjusting your search query or clear the filter.
          </p>
          <button onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }} className="btn btn-sm btn-outline" style={{ marginTop: '1rem' }}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Course Grid */}
      {!loading && !error && filteredCourses.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1.5rem' }}>
          {filteredCourses.map((course) => {
            const isCompleted = (course.progressPercentage || 0) >= 100;

            return (
              <div
                key={course.id || course._id}
                className="card-glass hover-scale"
                style={{
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Thumbnail with overlay badge */}
                <div style={{ position: 'relative', height: '170px' }}>
                  <img
                    src={course.thumbnail || 'https://via.placeholder.com/400x220'}
                    alt={course.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(0, 0, 0, 0.75)',
                      backdropFilter: 'blur(4px)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--accent)',
                    }}
                  >
                    {course.level || 'Class 12'}
                  </div>

                  {isCompleted && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(16, 185, 129, 0.9)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <FiCheckCircle size={12} /> Completed
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.35 }}>
                      {course.title}
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Instructor: <strong style={{ color: '#fff' }}>{course.instructor}</strong>
                    </p>
                  </div>

                  {/* Course Syllabus & Lesson stats */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 0.85rem',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiLayers color="var(--accent)" /> {course.totalSubjects || 1} Subject(s)
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiClock color="#f59e0b" /> {course.completedLessons || 0}/{course.totalLessons || 12} Lessons
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Syllabus Completion</span>
                      <span style={{ fontWeight: 700, color: isCompleted ? '#10b981' : 'var(--accent)' }}>
                        {course.progressPercentage || 0}%
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${course.progressPercentage || 0}%`,
                          height: '100%',
                          backgroundColor: isCompleted ? '#10b981' : 'var(--accent)',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <Link
                      to={`/courses/${course.id || course._id}/watch`}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      <FiPlayCircle size={18} />
                      {isCompleted ? 'Review Lectures' : 'Continue Learning'}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
};

export default MyCoursesPage;
