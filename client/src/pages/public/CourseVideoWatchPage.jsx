import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getCourseById } from '../../api/courseApi';
import { getAllNotes, getSecureAccess } from '../../api/noteApi';
import { useAuth } from '../../hooks/useAuth';
import VideoPlayerEmbed from '../../components/video/VideoPlayerEmbed';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import {
  FiPlay,
  FiLock,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiBookOpen,
  FiFileText,
  FiDownload,
  FiShare2,
  FiList,
  FiClock,
  FiLayers,
  FiArrowLeft,
  FiExternalLink,
} from 'react-icons/fi';

const CourseVideoWatchPage = () => {
  const { id: courseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'notes' | 'curriculum'
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);

  // Fetch Course details and hierarchy
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const res = await getCourseById(courseId);
        const courseData = res.data?.data?.course || res.data?.course || res.data;
        setCourse(courseData);

        // Fetch notes for this course
        try {
          const notesRes = await getAllNotes({ courseId });
          const noteList = notesRes.data?.data?.notes || notesRes.data?.notes || [];
          setNotes(noteList);
        } catch (e) {
          console.warn('Could not fetch course notes:', e);
        }
      } catch (err) {
        toast.error('Failed to load course video lecture');
      } finally {
        setLoading(false);
      }
    };
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  // Flatten lessons from hierarchy
  const allLessons = useMemo(() => {
    if (!course) return [];
    const list = [];
    const subjects = course.subjects || [];

    subjects.forEach((subj) => {
      const chapters = subj.chapters || [];
      chapters.forEach((chap) => {
        const classes = chap.dailyClasses || chap.lessons || [];
        classes.forEach((cls) => {
          list.push({
            ...cls,
            subjectName: subj.name,
            chapterTitle: chap.title,
            chapterId: chap.id || chap._id,
          });
        });
      });
    });

    return list;
  }, [course]);

  // Set initial active lesson from searchParams or first lesson
  useEffect(() => {
    if (allLessons.length > 0) {
      const requestedId = searchParams.get('lessonId');
      const found = allLessons.find((l) => (l.id || l._id) === requestedId);
      if (found) {
        setActiveLessonId(found.id || found._id);
      } else {
        const first = allLessons[0];
        const firstId = first.id || first._id;
        setActiveLessonId(firstId);
        setSearchParams({ lessonId: firstId }, { replace: true });
      }
    }
  }, [allLessons, searchParams]);

  // Current active lesson object
  const currentLesson = useMemo(() => {
    return allLessons.find((l) => (l.id || l._id) === activeLessonId) || allLessons[0] || null;
  }, [allLessons, activeLessonId]);

  // Check enrollment / ownership
  const isEnrolled = useMemo(() => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (course?.isFree) return true;
    return user.purchasedCourses?.includes(courseId);
  }, [user, course, courseId]);

  // Check if current lesson is locked
  const isCurrentLessonLocked = useMemo(() => {
    if (!currentLesson) return false;
    if (isEnrolled) return false;
    return !currentLesson.isFree;
  }, [currentLesson, isEnrolled]);

  const handleSelectLesson = (lesson) => {
    const lid = lesson.id || lesson._id;
    setActiveLessonId(lid);
    setSearchParams({ lessonId: lid });
  };

  const currentIndex = allLessons.findIndex((l) => (l.id || l._id) === activeLessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const handleOpenPdf = async (note) => {
    try {
      toast.loading('Opening secure study notes...', { id: 'pdf-access' });
      const res = await getSecureAccess(note.id || note._id);
      const accessData = res.data?.data || res.data;
      setSelectedPdf(accessData);
      setIsPdfModalOpen(true);
      toast.success('Study notes unlocked', { id: 'pdf-access' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Access restricted. Please enroll in course to unlock.', { id: 'pdf-access' });
    }
  };

  if (loading) return <Loader fullPage />;

  if (!course) {
    return (
      <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2>Course not found</h2>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0c0d14', minHeight: '100vh', color: '#fff' }}>
      {/* Header Bar */}
      <div
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#121420',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to={`/courses/${courseId}`}
            className="btn btn-sm btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'rgba(255,255,255,0.15)' }}
          >
            <FiArrowLeft /> Course Details
          </Link>
          <div>
            <h1 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, color: '#fff' }}>
              {course.title}
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Instructor: {course.instructor || 'SID Academy Faculty Team'} • {allLessons.length} Lectures
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isEnrolled ? (
            <span
              style={{
                backgroundColor: 'rgba(67, 233, 123, 0.15)',
                color: '#43e97b',
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <FiCheckCircle /> Enrolled Full Access
            </span>
          ) : (
            <Link
              to={`/courses/${courseId}`}
              className="btn btn-sm btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FiLock /> Unlock All Lectures
            </Link>
          )}
        </div>
      </div>

      {/* Main Watch Layout: Video Player (Left) + Syllabus Sidebar (Right) */}
      <div
        className="container-fluid"
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 380px',
          gap: '1.5rem',
        }}
      >
        {/* Left Column: Video Player & Lecture Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Video Player Component */}
          {currentLesson ? (
            <VideoPlayerEmbed
              videoUrl={currentLesson.videoUrl || currentLesson.youtubeUrl}
              playlistUrl={currentLesson.playlistUrl}
              title={currentLesson.title}
              thumbnailUrl={currentLesson.thumbnailUrl || course.thumbnail}
              isLocked={isCurrentLessonLocked}
              isFree={currentLesson.isFree}
              duration={currentLesson.duration}
              onUnlock={() => navigate(`/courses/${courseId}`)}
              autoPlay={false}
            />
          ) : (
            <div className="card-glass" style={{ padding: '3rem', textAlign: 'center' }}>
              <h3>No lessons available in this course</h3>
            </div>
          )}

          {/* Player Nav Controls (Previous / Next) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#161826',
              padding: '0.75rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <button
              onClick={() => prevLesson && handleSelectLesson(prevLesson)}
              disabled={!prevLesson}
              className="btn btn-sm btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FiChevronLeft /> Previous Lecture
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Lesson {currentIndex + 1} of {allLessons.length}
            </span>
            <button
              onClick={() => nextLesson && handleSelectLesson(nextLesson)}
              disabled={!nextLesson}
              className="btn btn-sm btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Next Lecture <FiChevronRight />
            </button>
          </div>

          {/* Active Lesson Header & Tab navigation */}
          {currentLesson && (
            <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {currentLesson.subjectName} • {currentLesson.chapterTitle}
                    </span>
                    {currentLesson.isFree ? (
                      <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Free Lecture Preview</span>
                    ) : (
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Premium Lecture</span>
                    )}
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                    {currentLesson.title}
                  </h2>
                </div>
                {currentLesson.duration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <FiClock /> {currentLesson.duration}
                  </div>
                )}
              </div>

              {/* Sub-tabs: Overview & Study Notes */}
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <button
                  onClick={() => setActiveTab('overview')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'overview' ? 700 : 500,
                    borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent',
                    paddingBottom: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                  }}
                >
                  Lecture Overview
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'notes' ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'notes' ? 700 : 500,
                    borderBottom: activeTab === 'notes' ? '2px solid var(--primary)' : '2px solid transparent',
                    paddingBottom: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <FiBookOpen size={16} /> Attached Study Notes & PDFs ({notes.length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' ? (
                <div>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', margin: '0 0 1.25rem 0' }}>
                    {currentLesson.description ||
                      'Comprehensive video lecture featuring detailed theory explanations, problem solving, derivations, and board exam tips by Sidd Academy faculty.'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', backgroundColor: '#131522', padding: '1rem', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Faculty</span>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{course.instructor || 'आकाश सर & Siddhant Pandey'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Class Target</span>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{course.level || 'Class 10-12 / Board Exams'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Format</span>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>YouTube HD Stream + PDF Support</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {notes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      <FiFileText size={32} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                      <p>No study PDFs uploaded for this chapter yet.</p>
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id || note._id}
                        style={{
                          backgroundColor: '#161826',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '8px',
                          padding: '1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(255, 101, 132, 0.15)',
                              color: '#ff6584',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <FiFileText size={20} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff' }}>{note.title}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {note.pageCount || 24} Pages • {note.isFree ? 'Free Access' : 'Enrolled Students Only'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenPdf(note)}
                          className="btn btn-sm btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <FiDownload size={14} /> Open PDF
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Playlist / Curriculum Sidebar */}
        <div
          style={{
            backgroundColor: '#161826',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 120px)',
          }}
        >
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: '#1a1c2d',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                Course Curriculum
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {allLessons.length} Video Lessons
              </span>
            </div>
            <FiList style={{ color: 'var(--primary)' }} />
          </div>

          {/* Scrollable Lesson Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {allLessons.map((lesson, idx) => {
              const lid = lesson.id || lesson._id;
              const isActive = lid === activeLessonId;
              const isLocked = !isEnrolled && !lesson.isFree;

              return (
                <div
                  key={lid}
                  onClick={() => handleSelectLesson(lesson)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'rgba(108, 99, 255, 0.18)' : 'transparent',
                    border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                    cursor: 'pointer',
                    marginBottom: '0.4rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: isActive
                        ? 'var(--primary)'
                        : isLocked
                        ? 'rgba(255, 117, 140, 0.15)'
                        : 'rgba(67, 233, 123, 0.15)',
                      color: isActive ? '#fff' : isLocked ? '#ff758c' : '#43e97b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: '0.1rem',
                    }}
                  >
                    {isLocked ? <FiLock size={12} /> : isActive ? <FiPlay size={12} /> : idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        margin: '0 0 0.25rem 0',
                        fontSize: '0.88rem',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#fff' : '#e0e0e0',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {lesson.title}
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{lesson.duration || '30:00'}</span>
                      <span>{lesson.isFree ? 'Free Preview' : isEnrolled ? 'Unlocked' : 'Premium'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PDF Secure Viewer Modal */}
      {isPdfModalOpen && selectedPdf && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setIsPdfModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#1b1c2b',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '900px',
              height: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{selectedPdf.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedPdf.fileName} • {selectedPdf.fileSize || '2.5 MB'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a
                  href={selectedPdf.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <FiExternalLink size={14} /> Open in Tab
                </a>
                <button onClick={() => setIsPdfModalOpen(false)} className="btn btn-sm btn-outline">
                  Close
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#2d3047' }}>
              <iframe
                src={selectedPdf.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                title={selectedPdf.title}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseVideoWatchPage;
