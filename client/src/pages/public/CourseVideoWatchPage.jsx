import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getCourseById } from '../../api/courseApi';
import { getAllNotes, getSecureAccess } from '../../api/noteApi';
import { updateLessonProgress } from '../../api/studentApi';
import { useAuth } from '../../hooks/useAuth';
import VideoPlayerEmbed from '../../components/video/VideoPlayerEmbed';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import {
  FiPlay,
  FiLock,
  FiCheckCircle,
  FiCircle,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiBookOpen,
  FiFileText,
  FiDownload,
  FiShare2,
  FiList,
  FiClock,
  FiLayers,
  FiArrowLeft,
  FiExternalLink,
  FiShoppingCart,
  FiShield,
  FiCheck,
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

  // Expanded subject/chapter accordion state
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});

  // Completed lesson IDs set for instant responsive updates
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [togglingProgress, setTogglingProgress] = useState(false);

  // Fetch Course details, hierarchy, and notes
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const res = await getCourseById(courseId);
        const courseData = res.data?.data?.course || res.data?.course || res.data;
        setCourse(courseData);

        // Auto-expand all subjects and chapters initially
        const subjMap = {};
        const chapMap = {};
        (courseData?.subjects || []).forEach((subj, sIdx) => {
          const sId = subj.id || subj._id || `subj-${sIdx}`;
          subjMap[sId] = true;
          (subj.chapters || []).forEach((chap, cIdx) => {
            const cId = chap.id || chap._id || `chap-${sIdx}-${cIdx}`;
            chapMap[cId] = true;
          });
        });
        setExpandedSubjects(subjMap);
        setExpandedChapters(chapMap);

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

  // Flatten lessons from course -> subjects -> chapters -> lessons hierarchy
  const allLessons = useMemo(() => {
    if (!course) return [];
    const list = [];
    const subjects = course.subjects || [];

    subjects.forEach((subj, sIdx) => {
      const sId = subj.id || subj._id || `subj-${sIdx}`;
      const chapters = subj.chapters || [];
      chapters.forEach((chap, cIdx) => {
        const cId = chap.id || chap._id || `chap-${sIdx}-${cIdx}`;
        const classes = chap.dailyClasses || chap.lessons || [];
        classes.forEach((cls, lIdx) => {
          const lId = cls.id || cls._id || `lesson-${sIdx}-${cIdx}-${lIdx}`;
          list.push({
            ...cls,
            id: lId,
            subjectId: sId,
            subjectName: subj.name,
            chapterId: cId,
            chapterTitle: chap.title,
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
      const found = allLessons.find((l) => l.id === requestedId || l._id === requestedId);
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
    const purchased = user.purchasedCourses || [];
    return purchased.includes(courseId) || purchased.some((p) => p.id === courseId || p._id === courseId);
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

  const toggleSubject = (sId) => {
    setExpandedSubjects((prev) => ({ ...prev, [sId]: !prev[sId] }));
  };

  const toggleChapter = (cId) => {
    setExpandedChapters((prev) => ({ ...prev, [cId]: !prev[cId] }));
  };

  const toggleComplete = async () => {
    if (!currentLesson || !isAuthenticated) {
      if (!isAuthenticated) {
        toast('Please login to track your lesson progress', { icon: '🔒' });
      }
      return;
    }
    const lid = currentLesson.id || currentLesson._id;
    const isNowCompleted = !completedLessons.has(lid);

    // Optimistic state update
    const updatedSet = new Set(completedLessons);
    if (isNowCompleted) {
      updatedSet.add(lid);
      toast.success('Lesson marked as completed! 🎉');
    } else {
      updatedSet.delete(lid);
      toast('Lesson marked as incomplete');
    }
    setCompletedLessons(updatedSet);

    try {
      setTogglingProgress(true);
      await updateLessonProgress(courseId, lid, isNowCompleted);
    } catch (err) {
      console.error('Failed to sync lesson progress:', err);
    } finally {
      setTogglingProgress(false);
    }
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
      toast.error(err.response?.data?.message || 'Access restricted. Please purchase note or enroll in course.', { id: 'pdf-access' });
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

  const isCurrentCompleted = currentLesson && completedLessons.has(currentLesson.id || currentLesson._id);

  return (
    <div style={{ backgroundColor: '#0c0d14', minHeight: '100vh', color: '#fff' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#121420',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to={isAuthenticated ? '/student/my-courses' : `/courses/${courseId}`}
            className="btn btn-sm btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: 'rgba(255,255,255,0.15)' }}
          >
            <FiArrowLeft /> {isAuthenticated ? 'My Courses' : 'Course Details'}
          </Link>
          <div>
            <h1 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, color: '#fff' }}>
              {course.title}
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Instructor: {course.instructor || 'SID Academy Faculty'} • {allLessons.length} Lectures Total
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isEnrolled ? (
            <span
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
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
              <FiShoppingCart /> Unlock Course (₹{course.discountPrice || course.price})
            </Link>
          )}
        </div>
      </header>

      {/* Main Watch Layout Grid */}
      <div
        className="container-fluid"
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 380px',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Video Player, Controls & Lecture Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Video Player or Locked State Card */}
          {isCurrentLessonLocked ? (
            <div
              className="card-glass"
              style={{
                borderRadius: '16px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '3.5rem 2rem',
                textAlign: 'center',
                backgroundColor: '#161826',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '380px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  marginBottom: '1.25rem',
                }}
              >
                <FiLock />
              </div>
              <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Premium Lecture Locked
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.4rem 0 0.5rem 0', maxWidth: '500px' }}>
                {currentLesson?.title || 'Unlock Full Syllabus to Continue'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
                This lecture is part of the complete premium curriculum. Enroll now to access all recorded lectures, chapter notes, and live doubt sessions.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
                  ₹{course.discountPrice || course.price}
                </span>
                {course.discountPrice && course.price && (
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                    ₹{course.price}
                  </span>
                )}
              </div>

              <Link
                to={`/courses/${courseId}`}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', fontSize: '0.95rem', fontWeight: 700 }}
              >
                <FiShoppingCart /> Enroll & Unlock Course
              </Link>
            </div>
          ) : currentLesson ? (
            <VideoPlayerEmbed
              videoUrl={currentLesson.videoUrl || currentLesson.youtubeUrl}
              playlistUrl={currentLesson.playlistUrl}
              title={currentLesson.title}
              thumbnailUrl={currentLesson.thumbnailUrl || course.thumbnail}
              isLocked={false}
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

          {/* Player Nav Controls (Previous / Next / Mark Complete) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#161826',
              padding: '0.85rem 1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <button
              onClick={() => prevLesson && handleSelectLesson(prevLesson)}
              disabled={!prevLesson}
              className="btn btn-sm btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FiChevronLeft /> Previous
            </button>

            {/* Mark as completed action */}
            {isAuthenticated && (
              <button
                onClick={toggleComplete}
                disabled={togglingProgress}
                className={`btn btn-sm ${isCurrentCompleted ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  backgroundColor: isCurrentCompleted ? '#10b981' : undefined,
                  borderColor: isCurrentCompleted ? '#10b981' : undefined,
                }}
              >
                {isCurrentCompleted ? <FiCheckCircle size={15} /> : <FiCircle size={15} />}
                {isCurrentCompleted ? 'Completed' : 'Mark as Complete'}
              </button>
            )}

            <button
              onClick={() => nextLesson && handleSelectLesson(nextLesson)}
              disabled={!nextLesson}
              className="btn btn-sm btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              Next <FiChevronRight />
            </button>
          </div>

          {/* Active Lesson Details & Tabs (Overview / Notes) */}
          {currentLesson && (
            <div className="card-glass" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {currentLesson.subjectName} • {currentLesson.chapterTitle}
                    </span>
                    {currentLesson.isFree ? (
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                        Free Demo
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: 'rgba(108, 99, 255, 0.15)', color: 'var(--accent)', fontWeight: 700 }}>
                        Full Course
                      </span>
                    )}
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                    {currentLesson.title}
                  </h2>
                </div>
                {currentLesson.duration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <FiClock /> {currentLesson.duration}
                  </div>
                )}
              </div>

              {/* Sub-tabs: Overview & Notes */}
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <button
                  onClick={() => setActiveTab('overview')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'overview' ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'overview' ? 700 : 500,
                    borderBottom: activeTab === 'overview' ? '2px solid var(--accent)' : '2px solid transparent',
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
                    color: activeTab === 'notes' ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'notes' ? 700 : 500,
                    borderBottom: activeTab === 'notes' ? '2px solid var(--accent)' : '2px solid transparent',
                    paddingBottom: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <FiBookOpen size={16} /> Chapter Notes ({notes.length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' ? (
                <div>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', margin: '0 0 1.25rem 0' }}>
                    {currentLesson.description ||
                      'Comprehensive video lecture featuring in-depth theoretical derivations, previous year board exam questions, conceptual problem solving, and handwritten formulas by SID Academy faculty.'}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', backgroundColor: '#131522', padding: '1rem 1.25rem', borderRadius: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Faculty</span>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{course.instructor || 'आकाश सर & Siddhant Pandey'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Target Class</span>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{course.level || 'Class 10 / 12 Board Exams'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Quality</span>
                      <strong style={{ fontSize: '0.9rem', color: '#fff' }}>1080p Full HD Video Stream</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {notes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                      <FiFileText size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                      <p style={{ margin: 0 }}>No separate study notes attached for this course yet.</p>
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id || note._id}
                        style={{
                          backgroundColor: '#161826',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          padding: '1rem 1.25rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <FiFileText size={20} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>{note.title}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {note.subjectName || 'Study Material'} • {note.fileSize || '2.8 MB'} PDF
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenPdf(note)}
                          className="btn btn-sm btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <FiDownload size={14} /> Open / Download PDF
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Hierarchical Navigation (Course -> Subject -> Chapter -> Lesson) */}
        <div
          style={{
            backgroundColor: '#161826',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 120px)',
            position: 'sticky',
            top: '80px',
          }}
        >
          {/* Syllabus Header */}
          <div
            style={{
              padding: '1.1rem 1.25rem',
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
                {allLessons.length} Total Lectures • {completedLessons.size} Completed
              </span>
            </div>
            <FiList style={{ color: 'var(--accent)' }} />
          </div>

          {/* Hierarchical Tree (Subjects -> Chapters -> Lessons) */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {(course.subjects || []).map((subject, sIdx) => {
              const sId = subject.id || subject._id || `subj-${sIdx}`;
              const isSubjExpanded = expandedSubjects[sId] !== false;

              return (
                <div key={sId} style={{ marginBottom: '0.75rem' }}>
                  {/* Subject Accordion Header */}
                  <div
                    onClick={() => toggleSubject(sId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: 'var(--accent)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FiLayers size={14} /> {subject.name}
                    </span>
                    {isSubjExpanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                  </div>

                  {/* Chapters List */}
                  {isSubjExpanded && (
                    <div style={{ paddingLeft: '0.5rem', marginTop: '0.4rem' }}>
                      {(subject.chapters || []).map((chapter, cIdx) => {
                        const cId = chapter.id || chapter._id || `chap-${sIdx}-${cIdx}`;
                        const isChapExpanded = expandedChapters[cId] !== false;
                        const lessons = chapter.dailyClasses || chapter.lessons || [];

                        return (
                          <div key={cId} style={{ marginBottom: '0.5rem' }}>
                            {/* Chapter Header */}
                            <div
                              onClick={() => toggleChapter(cId)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.4rem 0.6rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: '#e0e0e0',
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                Chapter {cIdx + 1}: {chapter.title}
                              </span>
                              {isChapExpanded ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                            </div>

                            {/* Lessons List under Chapter */}
                            {isChapExpanded && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '0.5rem' }}>
                                {lessons.map((lesson, lIdx) => {
                                  const lId = lesson.id || lesson._id || `lesson-${sIdx}-${cIdx}-${lIdx}`;
                                  const isActive = lId === activeLessonId;
                                  const isLocked = !isEnrolled && !lesson.isFree;
                                  const isDone = completedLessons.has(lId);

                                  return (
                                    <div
                                      key={lId}
                                      onClick={() => handleSelectLesson({ ...lesson, id: lId, subjectName: subject.name, chapterTitle: chapter.title })}
                                      style={{
                                        padding: '0.65rem 0.85rem',
                                        borderRadius: '8px',
                                        backgroundColor: isActive ? 'rgba(108, 99, 255, 0.2)' : 'transparent',
                                        border: isActive ? '1px solid var(--accent)' : '1px solid transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        gap: '0.65rem',
                                        alignItems: 'center',
                                        transition: 'all 0.15s',
                                      }}
                                    >
                                      {/* Icon status */}
                                      <div
                                        style={{
                                          width: '22px',
                                          height: '22px',
                                          borderRadius: '50%',
                                          backgroundColor: isDone
                                            ? 'rgba(16, 185, 129, 0.2)'
                                            : isActive
                                            ? 'var(--accent)'
                                            : isLocked
                                            ? 'rgba(239, 68, 68, 0.15)'
                                            : 'rgba(255, 255, 255, 0.08)',
                                          color: isDone ? '#10b981' : isActive ? '#fff' : isLocked ? '#ef4444' : 'var(--text-muted)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '0.75rem',
                                          flexShrink: 0,
                                        }}
                                      >
                                        {isDone ? <FiCheck size={11} /> : isLocked ? <FiLock size={11} /> : isActive ? <FiPlay size={10} /> : lIdx + 1}
                                      </div>

                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                          style={{
                                            fontSize: '0.82rem',
                                            fontWeight: isActive ? 700 : 500,
                                            color: isActive ? '#fff' : '#ccc',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                          }}
                                        >
                                          {lesson.title}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                          <span>{lesson.duration || '25 min'}</span>
                                          <span>{lesson.isFree ? 'Free Preview' : isEnrolled ? 'Unlocked' : 'Locked'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
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
            inset: 0,
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
              maxWidth: '920px',
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
                  {selectedPdf.fileName || 'Study Document'} • {selectedPdf.fileSize || '2.5 MB'}
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
                  <FiExternalLink size={14} /> Open in New Tab
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
