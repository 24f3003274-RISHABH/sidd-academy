import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getStudentDashboard } from '../../api/studentApi';
import { getSecureAccess } from '../../api/noteApi';
import StudentLayout from '../../components/student/StudentLayout';
import { SkeletonDashboard } from '../../components/common/SkeletonLoader';
import PdfPreviewModal, { triggerNoteDownload } from '../../components/notes/PdfPreviewModal';
import toast from 'react-hot-toast';
import { formatPrice, getEffectivePrice, resolveMediaUrl } from '../../utils/helpers';
import {
  FiBook,
  FiFileText,
  FiCheckCircle,
  FiPlayCircle,
  FiArrowRight,
  FiClock,
  FiDownload,
  FiEye,
  FiStar,
  FiUser,
  FiActivity,
  FiAlertCircle,
  FiCompass,
  FiAward,
} from 'react-icons/fi';

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setError(err.response?.data?.message || err.message || 'Unable to load your student dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleDownloadNote = async (note) => {
    try {
      const id = note.id || note._id;
      setDownloadingNoteId(id);
      const res = await getSecureAccess(id);
      const accessData = res.data?.data || res.data || note;
      await triggerNoteDownload({ ...note, ...accessData });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download note');
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
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <FiAlertCircle size={44} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>Unable to Load Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
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

  const kpiItems = [
    {
      label: 'Enrolled Courses',
      value: stats.enrolledCourses ?? enrolledCourses.length,
      icon: <FiBook size={20} />,
      bg: 'var(--primary-subtle)',
      color: 'var(--primary-dark)',
    },
    {
      label: 'Unlocked Notes',
      value: stats.purchasedNotes ?? purchasedNotes.length,
      icon: <FiFileText size={20} />,
      bg: 'var(--accent-subtle)',
      color: 'var(--accent-dark)',
    },
    {
      label: 'Completed Lessons',
      value: stats.totalLessonsCompleted || 0,
      icon: <FiCheckCircle size={20} />,
      bg: 'var(--secondary-subtle)',
      color: 'var(--secondary-dark)',
    },
    {
      label: 'Average Progress',
      value: `${stats.overallProgress || 0}%`,
      icon: <FiActivity size={20} />,
      bg: '#fdf2f8',
      color: '#be185d',
    },
  ];

  return (
    <StudentLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* 1. Welcome Banner */}
        <section
          className="student-dashboard-hero"
          style={{
            padding: '1.75rem 2rem',
            borderRadius: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ maxWidth: '580px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.28rem 0.75rem',
                borderRadius: '999px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--primary-border)',
                color: 'var(--primary-dark)',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
              }}
            >
              <FiAward size={13} /> Student Learning Space
            </div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 1.95rem)', fontWeight: 800, margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
              Welcome back, {profile?.name || user?.name || 'Student'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.94rem', lineHeight: 1.55 }}>
              Track your syllabus progress, resume classroom lectures, and read your handwritten notes in one place.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/courses" className="btn btn-outline">
              <FiCompass size={16} /> Browse Catalog
            </Link>
            {continueLearning && (
              <Link
                to={`/courses/${continueLearning.id || continueLearning._id}/watch`}
                className="btn btn-primary"
              >
                <FiPlayCircle size={16} /> Resume Learning
              </Link>
            )}
          </div>
        </section>

        {/* 2. Four Elevated KPI Cards */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
            gap: '1rem',
          }}
        >
          {kpiItems.map((item) => (
            <div
              key={item.label}
              className="stat-card"
              style={{
                padding: '1.2rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem',
                borderRadius: '14px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '11px',
                  backgroundColor: item.bg,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.15, color: 'var(--text-primary)' }}>
                  {item.value}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, marginTop: '0.15rem' }}>
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* 3. Continue Learning Spotlight */}
        {continueLearning && (
          <section
            className="card-glass"
            style={{
              padding: '1.35rem 1.5rem',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', flex: '1 1 300px', minWidth: 0 }}>
              <img
                src={resolveMediaUrl(continueLearning.thumbnail) || '/posters/target-batch-100-days-banner.jpg'}
                alt={continueLearning.title}
                style={{
                  width: '108px',
                  height: '68px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: '1px solid var(--border)',
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.06em' }}>
                  Continue Where You Left Off
                </div>
                <h3 style={{ fontSize: '1.05rem', margin: '0.2rem 0 0.25rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {continueLearning.title}
                </h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  By {continueLearning.instructor} • {continueLearning.progressPercentage || 0}% Completed
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '0 1 280px', minWidth: '220px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  <span>Progress</span>
                  <span>{continueLearning.progressPercentage || 0}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-muted)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, continueLearning.progressPercentage || 0)}%`,
                      height: '100%',
                      backgroundColor: 'var(--primary)',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
              <Link
                to={`/courses/${continueLearning.id || continueLearning._id}/watch`}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.55rem 1rem' }}
              >
                Resume <FiArrowRight size={14} />
              </Link>
            </div>
          </section>
        )}

        {/* 4. Two-Column Main Workspace: Enrolled Courses & Unlocked Notes */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: '1.5rem',
            alignItems: 'start',
          }}
        >
          {/* Enrolled Courses Column */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiBook style={{ color: 'var(--primary)' }} /> Enrolled Courses
              </h2>
              <Link to="/student/my-courses" style={{ color: 'var(--primary)', fontSize: '0.84rem', fontWeight: 600 }}>
                View All ({enrolledCourses.length})
              </Link>
            </div>

            {enrolledCourses.length === 0 ? (
              <div
                className="card-glass"
                style={{
                  padding: '2.25rem 1.5rem',
                  textAlign: 'center',
                  borderRadius: '14px',
                  border: '1px dashed var(--border)',
                }}
              >
                <FiBook size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.65rem' }} />
                <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>No Courses Enrolled Yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.15rem' }}>
                  Explore structured courses for Class 10–12 Physics, Chemistry, Biology &amp; English.
                </p>
                <Link to="/courses" className="btn btn-sm btn-primary">
                  Browse Courses
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {enrolledCourses.slice(0, 3).map((course) => (
                  <div
                    key={course.id || course._id}
                    className="card-glass"
                    style={{
                      padding: '1.15rem',
                      borderRadius: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center' }}>
                      <img
                        src={resolveMediaUrl(course.thumbnail) || '/posters/target-batch-100-days-banner.jpg'}
                        alt={course.title}
                        style={{
                          width: '76px',
                          height: '52px',
                          borderRadius: '8px',
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '1px solid var(--border)',
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '0.95rem', fontWeight: 700, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {course.title}
                        </h4>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {course.instructor}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        <span>Progress: {course.progressPercentage || 0}%</span>
                        <span>{course.completedLessons || 0}/{course.totalLessons || 1} Lessons</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-muted)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${Math.min(100, course.progressPercentage || 0)}%`,
                            height: '100%',
                            backgroundColor: course.progressPercentage === 100 ? 'var(--accent)' : 'var(--primary)',
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.15rem' }}>
                      <Link
                        to={`/courses/${course.id || course._id}/watch`}
                        className="btn btn-sm btn-primary"
                      >
                        <FiPlayCircle size={14} /> Open Course
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unlocked Notes Column */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiFileText style={{ color: 'var(--accent-dark)' }} /> Purchased Notes
              </h2>
              <Link to="/student/notes" style={{ color: 'var(--accent-dark)', fontSize: '0.84rem', fontWeight: 600 }}>
                View All ({purchasedNotes.length})
              </Link>
            </div>

            {purchasedNotes.length === 0 ? (
              <div
                className="card-glass"
                style={{
                  padding: '2.25rem 1.5rem',
                  textAlign: 'center',
                  borderRadius: '14px',
                  border: '1px dashed var(--border)',
                }}
              >
                <FiFileText size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.65rem' }} />
                <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>No Digital Notes Yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.15rem' }}>
                  Unlock handwritten topper notes, formula cheat sheets, and board revision sets.
                </p>
                <Link to="/notes" className="btn btn-sm btn-outline">
                  Browse Notes
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {purchasedNotes.slice(0, 3).map((note) => (
                  <div
                    key={note.id || note._id}
                    className="card-glass"
                    style={{
                      padding: '1.15rem',
                      borderRadius: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                    }}
                  >
                    <div>
                      <span
                        className="badge badge-success"
                        style={{ fontSize: '0.72rem', marginBottom: '0.45rem' }}
                      >
                        {note.subjectName || 'Study Material'}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, lineHeight: 1.35 }}>
                        {note.title}
                      </h4>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                        {note.fileSize || 'PDF'} • PDF Document
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.15rem' }}>
                      <button
                        type="button"
                        onClick={() => setPreviewNote(note)}
                        className="btn btn-sm btn-outline"
                      >
                        <FiEye size={14} /> Read Online
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadNote(note)}
                        disabled={downloadingNoteId === (note.id || note._id)}
                        className="btn btn-sm btn-primary"
                      >
                        <FiDownload size={14} /> {downloadingNoteId === (note.id || note._id) ? 'Downloading...' : 'Download'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 5. Recent & Scheduled Classes */}
        {recentClasses && recentClasses.length > 0 && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiClock style={{ color: 'var(--secondary)' }} /> Recent &amp; Scheduled Classes
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              {recentClasses.map((cls) => (
                <div
                  key={cls.id || cls._id}
                  className="card-glass"
                  style={{
                    padding: '1.15rem',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.55rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                      {cls.subjectName}
                    </span>
                    {cls.isCompleted ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-dark)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                        <FiCheckCircle size={12} /> Watched
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cls.duration}</span>
                    )}
                  </div>

                  <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, lineHeight: 1.4 }}>
                    {cls.title}
                  </h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Chapter: {cls.chapterTitle}
                  </p>

                  <Link
                    to={`/courses/${cls.courseId}/watch?lessonId=${cls.id || cls._id}`}
                    className="btn btn-sm btn-outline"
                    style={{ marginTop: 'auto', paddingTop: '0.45rem', paddingBottom: '0.45rem' }}
                  >
                    <FiPlayCircle size={14} /> Watch Class
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Recommended Available Courses */}
        {availableCourses && availableCourses.length > 0 && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiCompass style={{ color: 'var(--primary)' }} /> Explore Available Courses
              </h2>
              <Link to="/courses" style={{ color: 'var(--primary)', fontSize: '0.84rem', fontWeight: 600 }}>
                Browse Full Catalog
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.1rem' }}>
              {availableCourses.map((c) => (
                <div
                  key={c.id || c._id}
                  className="card"
                  style={{
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <img
                    src={resolveMediaUrl(c.thumbnail) || '/posters/target-batch-100-days-banner.jpg'}
                    alt={c.title}
                    style={{ width: '100%', height: '132px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>{c.level}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                        <FiStar size={12} fill="#f59e0b" /> {c.rating || '4.9'}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 0.65rem 0', fontSize: '0.92rem', fontWeight: 700, lineHeight: 1.35, minHeight: '2.5em' }}>
                      {c.title}
                    </h4>

                    <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, color: c.isFree ? 'var(--accent-dark)' : 'var(--text-primary)' }}>
                        {c.isFree ? 'FREE' : formatPrice(getEffectivePrice(c))}
                      </span>
                      <Link to={`/courses/${c.id || c._id}`} className="btn btn-sm btn-primary">
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. Activity Feed & Account Summary */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
          <div className="card-glass" style={{ padding: '1.35rem 1.5rem', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiActivity style={{ color: 'var(--primary)' }} /> Recent Activity
            </h3>
            {recentActivities.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No recent activity logged yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {recentActivities.slice(0, 5).map((act) => (
                  <div key={act.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: act.badge === 'Course' ? 'var(--primary-subtle)' : 'var(--accent-subtle)',
                        color: act.badge === 'Course' ? 'var(--primary)' : 'var(--accent-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {act.badge === 'Course' ? <FiBook size={13} /> : <FiFileText size={13} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{act.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>{act.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-glass" style={{ padding: '1.35rem 1.5rem', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiUser style={{ color: 'var(--primary)' }} /> Student Profile
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-subtle)',
                    color: 'var(--primary-dark)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  {(profile?.name || user?.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{profile?.name || user?.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.email || user?.email}</div>
                  {profile?.phone && <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{profile.phone}</div>}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-success">Active Student</span>
              <Link to="/student/profile" className="btn btn-sm btn-outline">
                Edit Profile
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Unified PDF Quick Preview Modal */}
      {previewNote && (
        <PdfPreviewModal
          note={previewNote}
          onClose={() => setPreviewNote(null)}
        />
      )}
    </StudentLayout>
  );
};

export default DashboardPage;
