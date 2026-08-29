import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getStudentDashboard } from '../../api/studentApi';
import { getSecureAccess } from '../../api/noteApi';
import StudentLayout from '../../components/student/StudentLayout';
import { SkeletonDashboard } from '../../components/common/SkeletonLoader';
import toast from 'react-hot-toast';
import {
  FiBook,
  FiFileText,
  FiCheckCircle,
  FiPlayCircle,
  FiArrowRight,
  FiClock,
  FiDownload,
  FiEye,
  FiLayers,
  FiStar,
  FiUser,
  FiActivity,
  FiAlertCircle,
  FiCompass,
  FiAward,
  FiExternalLink,
} from 'react-icons/fi';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // PDF Preview modal states for quick note viewing
  const [previewNote, setPreviewNote] = useState(null);
  const [downloadingNoteId, setDownloadingNoteId] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudentDashboard();
      if (res.data && res.data.data) {
        setDashboardData(res.data.data);
      } else if (res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
      setError('Unable to load your student dashboard. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleDownloadNote = async (note) => {
    try {
      setDownloadingNoteId(note.id || note._id);
      const res = await getSecureAccess(note.id || note._id);
      const token = res.data?.data?.accessToken || res.data?.accessToken;
      const fileUrl = res.data?.data?.fileUrl || res.data?.fileUrl || note.fileUrl;

      toast.success(`Preparing secure download for: ${note.title}`);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.download = `${note.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error('Failed to initiate secure note download');
    } finally {
      setDownloadingNoteId(null);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <SkeletonDashboard />
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div
          className="card-glass"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <FiAlertCircle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Failed to Load Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' }}>
            {error}
          </p>
          <button onClick={fetchDashboard} className="btn btn-primary">
            Retry Loading
          </button>
        </div>
      </StudentLayout>
    );
  }

  const {
    profile = user,
    stats = {},
    continueLearning = null,
    enrolledCourses = [],
    purchasedNotes = [],
    recentClasses = [],
    availableCourses = [],
    recentActivities = [],
  } = dashboardData || {};

  return (
    <StudentLayout>
      {/* 1. WELCOME SECTION & MOTIVATION HERO */}
      <div
        className="card-glass"
        style={{
          padding: '2rem',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.15) 0%, rgba(19, 23, 40, 0.8) 100%)',
          border: '1px solid rgba(108, 99, 255, 0.25)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: '20px', backgroundColor: 'rgba(108, 99, 255, 0.2)', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              <FiAward /> Student Learning Space
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              Welcome back, {profile?.name || user?.name || 'Student'}! 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem', maxWidth: '600px', lineHeight: 1.5 }}>
              Continuously track your syllabus completion, watch scheduled classroom lectures, and review your handwritten master notes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/courses" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiCompass /> Browse Catalog
            </Link>
            {continueLearning && (
              <Link to={`/courses/${continueLearning.id || continueLearning._id}/watch`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FiPlayCircle /> Resume Learning
              </Link>
            )}
          </div>
        </div>

        {/* Quick Learning Stats Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(108, 99, 255, 0.2)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              <FiBook />
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{stats.enrolledCourses || enrolledCourses.length}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Enrolled Courses</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              <FiFileText />
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{stats.purchasedNotes || purchasedNotes.length}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Purchased Notes</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              <FiCheckCircle />
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{stats.totalLessonsCompleted || 0}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Completed Lessons</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              <FiActivity />
            </div>
            <div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800 }}>{stats.overallProgress || 0}%</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Average Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CONTINUE LEARNING BANNER (If Enrolled) */}
      {continueLearning && (
        <div
          className="card-glass"
          style={{
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <img
              src={continueLearning.thumbnail || 'https://via.placeholder.com/160x100'}
              alt={continueLearning.title}
              style={{ width: '100px', height: '65px', borderRadius: '10px', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em' }}>
                Continue Where You Left Off
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: '0.2rem 0', fontWeight: 700 }}>
                {continueLearning.title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span>By {continueLearning.instructor}</span>
                <span>•</span>
                <span>{continueLearning.progressPercentage || 0}% Completed</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '220px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${continueLearning.progressPercentage || 0}%`,
                    height: '100%',
                    backgroundColor: 'var(--accent)',
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
            <Link
              to={`/courses/${continueLearning.id || continueLearning._id}/watch`}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
            >
              Resume <FiArrowRight />
            </Link>
          </div>
        </div>
      )}

      {/* 3. TWO-COLUMN MAIN CONTENT: ENROLLED COURSES & PURCHASED NOTES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        {/* Enrolled Courses */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiBook style={{ color: 'var(--accent)' }} /> Enrolled Courses
            </h2>
            <Link to="/student/my-courses" style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              View All ({enrolledCourses.length})
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div
              className="card-glass"
              style={{
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                borderRadius: '16px',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
              }}
            >
              <FiBook size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.4rem' }}>No Courses Enrolled Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Explore our full syllabus courses for Class 10 & 12 Science, Chemistry, Biology & English.
              </p>
              <Link to="/courses" className="btn btn-sm btn-primary">
                Browse Courses
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {enrolledCourses.slice(0, 3).map((course) => (
                <div
                  key={course.id || course._id}
                  className="card-glass hover-scale"
                  style={{
                    padding: '1.25rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <img
                      src={course.thumbnail || 'https://via.placeholder.com/120x80'}
                      alt={course.title}
                      style={{ width: '80px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {course.title}
                      </h4>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        Instructor: {course.instructor}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Progress: {course.progressPercentage || 0}%</span>
                    <span>{course.completedLessons || 0}/{course.totalLessons || 12} Lessons</span>
                  </div>

                  <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${course.progressPercentage || 0}%`,
                        height: '100%',
                        backgroundColor: course.progressPercentage === 100 ? '#10b981' : 'var(--accent)',
                        borderRadius: '3px',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <Link
                      to={`/courses/${course.id || course._id}/watch`}
                      className="btn btn-sm btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                    >
                      <FiPlayCircle /> Open Course
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchased Notes */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiFileText style={{ color: '#10b981' }} /> Purchased Notes
            </h2>
            <Link to="/student/notes" style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              View All ({purchasedNotes.length})
            </Link>
          </div>

          {purchasedNotes.length === 0 ? (
            <div
              className="card-glass"
              style={{
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                borderRadius: '16px',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
              }}
            >
              <FiFileText size={36} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.4rem' }}>No Digital Notes Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Access verified handwritten topper notes, formula cheat sheets, and board revision sets.
              </p>
              <Link to="/notes" className="btn btn-sm btn-outline">
                Browse Notes
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {purchasedNotes.slice(0, 3).map((note) => (
                <div
                  key={note.id || note._id}
                  className="card-glass hover-scale"
                  style={{
                    padding: '1.25rem',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ overflow: 'hidden' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          display: 'inline-block',
                          marginBottom: '0.35rem',
                        }}
                      >
                        {note.subjectName || 'Study Material'}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.3 }}>
                        {note.title}
                      </h4>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        File Size: {note.fileSize || '2.5 MB'} • PDF Document
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button
                      onClick={() => setPreviewNote(note)}
                      className="btn btn-sm btn-outline"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                    >
                      <FiEye /> Read Online
                    </button>
                    <button
                      onClick={() => handleDownloadNote(note)}
                      disabled={downloadingNoteId === (note.id || note._id)}
                      className="btn btn-sm btn-primary"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                    >
                      <FiDownload /> {downloadingNoteId === (note.id || note._id) ? 'Downloading...' : 'Download'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. RECENT DAILY CLASSES SECTION */}
      {recentClasses && recentClasses.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiClock style={{ color: '#f59e0b' }} /> Recent & Scheduled Classes
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {recentClasses.map((cls) => (
              <div
                key={cls.id || cls._id}
                className="card-glass hover-scale"
                style={{
                  padding: '1.25rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                    {cls.subjectName}
                  </span>
                  {cls.isCompleted ? (
                    <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                      <FiCheckCircle size={12} /> Watched
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cls.duration}</span>
                  )}
                </div>

                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.4 }}>
                  {cls.title}
                </h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Chapter: {cls.chapterTitle}
                </p>

                <Link
                  to={`/courses/${cls.courseId}/watch?lessonId=${cls.id || cls._id}`}
                  className="btn btn-sm btn-outline"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem' }}
                >
                  <FiPlayCircle /> Watch Class
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. AVAILABLE COURSES CATALOG PREVIEW */}
      {availableCourses && availableCourses.length > 0 && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiCompass style={{ color: 'var(--accent)' }} /> Explore Available Courses
            </h2>
            <Link to="/courses" style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              Browse Full Catalog
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {availableCourses.map((c) => (
              <div
                key={c.id || c._id}
                className="card-glass hover-scale"
                style={{
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <img
                  src={c.thumbnail || 'https://via.placeholder.com/300x160'}
                  alt={c.title}
                  style={{ width: '100%', height: '130px', objectFit: 'cover' }}
                />
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>{c.level}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: '#f59e0b' }}>
                      <FiStar size={12} fill="#f59e0b" /> {c.rating || '4.9'}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.3, minHeight: '2.4em' }}>
                    {c.title}
                  </h4>

                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      {c.isFree ? (
                        <span style={{ fontWeight: 800, color: '#10b981' }}>FREE</span>
                      ) : (
                        <span style={{ fontWeight: 800, color: '#fff' }}>₹{c.discountPrice || c.price}</span>
                      )}
                    </div>
                    <Link to={`/courses/${c.id || c._id}`} className="btn btn-sm btn-primary">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. RECENT ACTIVITY & PROFILE SUMMARY FOOTER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Activity Feed */}
        <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiActivity style={{ color: 'var(--accent)' }} /> Recent Activity
          </h3>
          {recentActivities.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activity logged.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentActivities.map((act) => (
                <div key={act.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: act.badge === 'Course' ? 'rgba(108, 99, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: act.badge === 'Course' ? 'var(--accent)' : '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {act.badge === 'Course' ? <FiBook size={14} /> : <FiFileText size={14} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{act.title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{act.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiUser style={{ color: 'var(--accent)' }} /> Student Profile
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                backgroundColor: 'rgba(108, 99, 255, 0.2)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
              }}
            >
              {(profile?.name || user?.name || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{profile?.name || user?.name}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{profile?.email || user?.email}</div>
              {profile?.phone && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{profile.phone}</div>}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status: Active Student</span>
            <Link to="/student/profile" className="btn btn-sm btn-outline">
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      {/* PDF Quick Preview Modal */}
      {previewNote && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setPreviewNote(null)}
        >
          <div
            className="card-glass"
            style={{
              width: '100%',
              maxWidth: '900px',
              height: '85vh',
              backgroundColor: '#131728',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{previewNote.title}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Subject: {previewNote.subjectName}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleDownloadNote(previewNote)}
                  className="btn btn-sm btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <FiDownload /> Download PDF
                </button>
                <button onClick={() => setPreviewNote(null)} className="btn btn-sm btn-outline">
                  Close
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#0b0e17' }}>
              <iframe
                src={`${previewNote.fileUrl}#toolbar=1`}
                title={previewNote.title}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default DashboardPage;
