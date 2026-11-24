import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAllCourses, previewPlaylist, importPlaylist } from '../../api/courseApi';
import {
  getSubjectsByCourse,
  getChaptersBySubject,
  getClassesByChapter,
  createSubject,
  createChapter,
  createClass,
  updateClass,
  deleteClass,
} from '../../api/adminApi';
import { getAllNotes, createNote, updateNote, deleteNote } from '../../api/noteApi';
import { getNoteDriveViewUrl } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import {
  FiBook,
  FiFolder,
  FiList,
  FiPlus,
  FiTrash2,
  FiSave,
  FiAlertCircle,
  FiBookOpen,
  FiCloud,
  FiExternalLink,
  FiYoutube,
  FiFileText,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const getList = (response, key) => {
  const data = response.data?.data || response.data || {};
  return data[key] || (Array.isArray(data) ? data : []);
};

const getId = (item) => item?.id || item?._id || '';

const emptyLesson = {
  title: '',
  description: '',
  classDate: '',
  duration: '30:00',
  order: 1,
  classNumber: 1,
  videoUrl: '',
  videoProvider: 'youtube',
  isFree: true,
  isProtected: false,
};

const QUICK_PLAYLISTS = [
  { id: 'PLKsilHHi-1ZQ', title: 'CHEMICAL KINETICS (11 Videos)' },
  { id: 'PL4DQCiK7p4ZWD80a41vqlZT71zXdas7Pl', title: 'SOLUTION (12 Videos)' },
  { id: 'PL4DQCiK7p4ZU2pstQafHazLxW32KZUdNU', title: 'ELECTROCHEMISTRY (10 Videos)' },
  { id: 'PL4DQCiK7p4ZWWIfRWknHd8zYxGdOCyvip', title: 'Electrostatic (11 Videos)' },
  { id: 'PLF7wljYwTV-w', title: 'Alcohol Phenol Ether (13 Videos)' },
  { id: 'PLAx_BGsVQuKc', title: 'BIOMOLECULES (6 Videos)' },
  { id: 'PLRntVCXiEo8E', title: 'Biology पुष्पी पादपो में लैंगिक जनन (2 Videos)' },
  { id: 'PLMAR6dVeMATU', title: 'Electric Current 💡⚡ (4 Videos)' },
  { id: 'PLLN2WU1NsA2o', title: 'RAY OPTICS (3 Videos)' },
  { id: 'PLFBdKX91EvMA', title: 'BASIC MATHEMATICS (4 Videos)' },
];

const CurriculumPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('courseId') || '');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSection, setLoadingSection] = useState('');
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [lessonSaving, setLessonSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formValue, setFormValue] = useState({ title: '', description: '' });
  const [lessonForm, setLessonForm] = useState(emptyLesson);

  // Study Notes State (Course, Chapter, Lesson)
  const [notes, setNotes] = useState([]);
  const [noteTab, setNoteTab] = useState('chapter'); // 'chapter' | 'course' | 'lesson'
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [resourceSaving, setResourceSaving] = useState(false);
  const [newPdfFiles, setNewPdfFiles] = useState([]);
  const [newPdfTitle, setNewPdfTitle] = useState('');
  const [newPdfIsFree, setNewPdfIsFree] = useState(true);
  const [newPdfPrice, setNewPdfPrice] = useState(0);
  const [uploadingToDrive, setUploadingToDrive] = useState(false);

  // Bulk YouTube Playlist / Multi-Video Import State
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [playlistUrlInput, setPlaylistUrlInput] = useState('');
  const [fetchingPlaylist, setFetchingPlaylist] = useState(false);
  const [importingPlaylist, setImportingPlaylist] = useState(false);
  const [previewVideos, setPreviewVideos] = useState([]);
  const [previewTitle, setPreviewTitle] = useState('');

  const loadCourses = async () => {
    setLoading(true);
    try {
      const list = getList(await getAllCourses({ limit: 100 }), 'courses');
      setCourses(list);
      const urlCourseId = searchParams.get('courseId');
      const preferredId =
        urlCourseId && list.some((c) => getId(c) === urlCourseId)
          ? urlCourseId
          : selectedCourse || getId(list[0]);
      setSelectedCourse(preferredId);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load courses.');
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async () => {
    try {
      const response = await getAllNotes({ limit: 100 });
      setNotes(getList(response, 'notes'));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load study materials.');
    }
  };

  const loadSubjects = async (courseId, preferredId = '') => {
    if (!courseId) return;
    setLoadingSection('subjects');
    try {
      const list = getList(await getSubjectsByCourse(courseId), 'subjects');
      setSubjects(list);
      setSelectedSubject(preferredId || getId(list[0]));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load subjects.');
    } finally {
      setLoadingSection('');
    }
  };

  const loadChapters = async (subjectId, preferredId = '') => {
    if (!subjectId) return;
    setLoadingSection('chapters');
    try {
      const list = getList(await getChaptersBySubject(subjectId), 'chapters');
      setChapters(list);
      setSelectedChapter(preferredId || getId(list[0]));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load chapters.');
    } finally {
      setLoadingSection('');
    }
  };

  const loadLessons = async (chapterId, preferredId = '') => {
    if (!chapterId) return;
    setLoadingSection('lessons');
    try {
      const response = await getClassesByChapter(chapterId);
      const data = response.data?.data || response.data || {};
      const list = data.lessons || data.classes || (Array.isArray(data) ? data : []);
      setLessons(list);
      const nextId = preferredId || getId(list[0]);
      setSelectedLesson(nextId);
      const nextLesson = list.find((lesson) => getId(lesson) === nextId);
      setLessonForm(
        nextLesson
          ? { ...emptyLesson, ...nextLesson }
          : { ...emptyLesson, order: list.length + 1, classNumber: list.length + 1 }
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load lessons.');
    } finally {
      setLoadingSection('');
    }
  };

  useEffect(() => {
    loadCourses();
    loadNotes();
  }, []);
  useEffect(() => {
    setSelectedSubject('');
    setSelectedChapter('');
    setSelectedLesson('');
    setSubjects([]);
    setChapters([]);
    setLessons([]);
    loadSubjects(selectedCourse);
  }, [selectedCourse]);
  useEffect(() => {
    setSelectedChapter('');
    setSelectedLesson('');
    setChapters([]);
    setLessons([]);
    loadChapters(selectedSubject);
  }, [selectedSubject]);
  useEffect(() => {
    setSelectedLesson('');
    setLessons([]);
    loadLessons(selectedChapter);
  }, [selectedChapter]);

  const selectLesson = (lesson) => {
    setSelectedLesson(getId(lesson));
    setLessonForm({ ...emptyLesson, ...lesson });
  };

  // Filtered notes by level
  const courseNotes = notes.filter((n) => (n.courseId || n.course_id) === selectedCourse);
  const chapterNotes = notes.filter(
    (n) =>
      (n.chapterId || n.chapter_id) === selectedChapter ||
      (selectedChapter && lessons.some((l) => getId(l) === (n.lessonId || n.lesson_id)))
  );
  const lessonNotes = notes.filter((n) => (n.lessonId || n.lesson_id) === selectedLesson);

  const activeNotesList =
    noteTab === 'chapter' ? chapterNotes : noteTab === 'course' ? courseNotes : lessonNotes;

  const attachNote = async () => {
    if (!selectedNoteId || resourceSaving) return;
    setResourceSaving(true);
    try {
      const payload = {
        courseId: selectedCourse || null,
        subjectId: noteTab !== 'course' ? selectedSubject || null : null,
        chapterId: noteTab === 'chapter' || noteTab === 'lesson' ? selectedChapter || null : null,
        lessonId: noteTab === 'lesson' ? selectedLesson || null : null,
      };
      await updateNote(selectedNoteId, payload);
      toast.success(`Study material attached to ${noteTab}!`);
      setSelectedNoteId('');
      await loadNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not attach study material');
    } finally {
      setResourceSaving(false);
    }
  };

  const handleRemoveNote = async (noteId) => {
    if (resourceSaving) return;
    setResourceSaving(true);
    try {
      await deleteNote(noteId);
      toast.success('Study material deleted');
      await loadNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove study material');
    } finally {
      setResourceSaving(false);
    }
  };

  const uploadNotesToDrive = async (e) => {
    e.preventDefault();
    if (newPdfFiles.length === 0 || !selectedCourse || uploadingToDrive) return;
    setUploadingToDrive(true);
    try {
      let count = 0;
      for (const file of newPdfFiles) {
        const formData = new FormData();
        const itemTitle =
          newPdfFiles.length === 1 && newPdfTitle.trim()
            ? newPdfTitle.trim()
            : file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
        formData.append('title', itemTitle);
        formData.append(
          'description',
          `Study material for ${
            noteTab === 'lesson'
              ? lessonForm.title || 'Lesson'
              : noteTab === 'chapter'
              ? chapterTitle || 'Chapter'
              : courseTitle || 'Course'
          }`
        );
        formData.append('isFree', Boolean(newPdfIsFree));
        formData.append('price', newPdfIsFree ? 0 : Number(newPdfPrice) || 0);
        formData.append('isPublished', true);
        if (selectedCourse) formData.append('courseId', selectedCourse);
        if ((noteTab === 'chapter' || noteTab === 'lesson') && selectedSubject) {
          formData.append('subjectId', selectedSubject);
        }
        if ((noteTab === 'chapter' || noteTab === 'lesson') && selectedChapter) {
          formData.append('chapterId', selectedChapter);
        }
        if (noteTab === 'lesson' && selectedLesson) {
          formData.append('lessonId', selectedLesson);
        }
        formData.append('file', file);

        await createNote(formData);
        count++;
      }

      toast.success(`Uploaded ${count} PDF(s) to Google Drive & linked to ${noteTab}!`);
      setNewPdfFiles([]);
      setNewPdfTitle('');
      await loadNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload study material to Google Drive');
    } finally {
      setUploadingToDrive(false);
    }
  };

  // --- Bulk YouTube Playlist Import into Current Course / Chapter ---
  const handlePreviewPlaylistInStudio = async (urlOverride = null) => {
    const input = (urlOverride !== null ? urlOverride : playlistUrlInput).trim();
    if (!input) {
      toast.error('Please enter a YouTube Playlist URL or video URLs');
      return;
    }
    setFetchingPlaylist(true);
    try {
      const res = await previewPlaylist({ playlistUrl: input });
      const data = res.data?.data || res.data;
      setPreviewVideos(data.videos || []);
      setPreviewTitle(data.title || 'Imported Playlist');
      toast.success(`Loaded ${data.videos?.length || 0} videos in playlist order!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not fetch YouTube playlist');
    } finally {
      setFetchingPlaylist(false);
    }
  };

  const handleImportPlaylistIntoStudio = async (e) => {
    e.preventDefault();
    if (!selectedCourse || importingPlaylist) return;
    setImportingPlaylist(true);
    try {
      const res = await importPlaylist({
        courseId: selectedCourse,
        subjectId: selectedSubject || undefined,
        chapterId: selectedChapter || undefined,
        subjectTitle: subjectTitle || previewTitle || 'Main Subject',
        chapterTitle: chapterTitle || `Chapter: ${previewTitle || 'Playlist Lectures'}`,
        playlistUrl: playlistUrlInput.trim(),
        videos: previewVideos.length > 0 ? previewVideos : undefined,
      });
      const result = res.data?.data || res.data;
      toast.success(`Imported ${result.importedCount || previewVideos.length} videos in exact playlist order!`);
      setPlaylistModalOpen(false);
      setPlaylistUrlInput('');
      setPreviewVideos([]);
      await loadSubjects(selectedCourse, result.subject?.id || selectedSubject);
      if (result.chapter?.id || selectedChapter) {
        await loadLessons(result.chapter?.id || selectedChapter);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import playlist videos');
    } finally {
      setImportingPlaylist(false);
    }
  };

  const openCreate = (type) => {
    setFormValue({ title: '', description: '' });
    setModal(type);
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    if (submitting || !formValue.title.trim()) return;
    setSubmitting(true);
    try {
      if (modal === 'subject') {
        const response = await createSubject({
          name: formValue.title.trim(),
          description: formValue.description,
          courseId: selectedCourse,
        });
        await loadSubjects(selectedCourse, getId(response.data?.data?.subject));
      } else {
        const response = await createChapter({
          title: formValue.title.trim(),
          content: formValue.description,
          subjectId: selectedSubject,
        });
        await loadChapters(selectedSubject, getId(response.data?.data?.chapter));
      }
      toast.success(`${modal} created`);
      setModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || `Could not create ${modal}`);
    } finally {
      setSubmitting(false);
    }
  };

  const saveLesson = async (event) => {
    event.preventDefault();
    if (!lessonForm.title.trim() || lessonSaving) return;
    setLessonSaving(true);
    try {
      const payload = {
        ...lessonForm,
        chapterId: selectedChapter,
        duration: lessonForm.duration || '30:00',
        order: Number(lessonForm.order) || 1,
        classNumber: Number(lessonForm.classNumber) || 1,
      };
      const response = selectedLesson
        ? await updateClass(selectedLesson, payload)
        : await createClass(payload);
      const saved = response.data?.data?.lesson || response.data?.data?.dailyClass;
      toast.success(selectedLesson ? 'Lesson updated' : 'Lesson created');
      await loadLessons(selectedChapter, getId(saved));
      await loadNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save lesson');
    } finally {
      setLessonSaving(false);
    }
  };

  const removeLesson = async () => {
    if (!selectedLesson || deletingId) return;
    setDeletingId(selectedLesson);
    try {
      await deleteClass(selectedLesson);
      toast.success('Lesson deleted');
      await loadLessons(selectedChapter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete lesson');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <Loader fullPage label="Loading Course Studio" />;

  const courseTitle = courses.find((course) => getId(course) === selectedCourse)?.title;
  const subjectTitle =
    subjects.find((subject) => getId(subject) === selectedSubject)?.name ||
    subjects.find((subject) => getId(subject) === selectedSubject)?.title;
  const chapterTitle = chapters.find((chapter) => getId(chapter) === selectedChapter)?.title;

  return (
    <div className="admin-curriculum-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-kicker">Teacher workspace</span>
          <h1>Course Studio & Playlist Importer</h1>
          <p>
            Build the course students will see: import entire YouTube playlists in order, manage chapters & videos, and upload Course or Chapter PDFs directly to Google Drive.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={!selectedCourse}
            onClick={() => {
              setPlaylistUrlInput('');
              setPreviewVideos([]);
              setPlaylistModalOpen(true);
            }}
            className="btn btn-primary btn-sm"
            style={{
              backgroundColor: '#dc2626',
              borderColor: '#dc2626',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
            }}
          >
            <FiYoutube /> Import YouTube Playlist / Bulk Videos
          </button>
          <Link to="/admin/courses" className="btn btn-outline btn-sm">
            <FiBook /> Manage Courses
          </Link>
        </div>
      </div>

      {error && (
        <div className="admin-inline-error">
          <FiAlertCircle /> {error}
          <button type="button" onClick={() => setError('')}>
            Dismiss
          </button>
        </div>
      )}

      <div className="course-studio-layout">
        <aside className="course-studio-tree card">
          <div className="studio-panel-heading">
            <div>
              <span className="admin-kicker">Course</span>
              <h2>Curriculum tree</h2>
            </div>
          </div>
          <select
            className="form-select"
            value={selectedCourse}
            onChange={(event) => {
              const nextId = event.target.value;
              setSelectedCourse(nextId);
              setSearchParams(nextId ? { courseId: nextId } : {});
            }}
          >
            <option value="">Select a course</option>
            {courses.map((course) => (
              <option key={getId(course)} value={getId(course)}>
                {course.title}
              </option>
            ))}
          </select>

          <div className="studio-tree-section">
            <div className="studio-tree-label">
              <FiFolder /> Subjects{' '}
              <button
                type="button"
                onClick={() => openCreate('subject')}
                disabled={!selectedCourse}
                title="Add subject"
              >
                <FiPlus />
              </button>
            </div>
            {loadingSection === 'subjects' && <p className="studio-muted">Loading subjects...</p>}
            {subjects.map((subject) => (
              <button
                type="button"
                key={getId(subject)}
                className={`studio-tree-item ${selectedSubject === getId(subject) ? 'is-active' : ''}`}
                onClick={() => setSelectedSubject(getId(subject))}
              >
                {subject.name || subject.title}
              </button>
            ))}
            {!subjects.length && selectedCourse && loadingSection !== 'subjects' && (
              <p className="studio-muted">No subjects yet.</p>
            )}
          </div>

          <div className="studio-tree-section">
            <div className="studio-tree-label">
              <FiList /> Chapters{' '}
              <button
                type="button"
                onClick={() => openCreate('chapter')}
                disabled={!selectedSubject}
                title="Add chapter"
              >
                <FiPlus />
              </button>
            </div>
            {loadingSection === 'chapters' && <p className="studio-muted">Loading chapters...</p>}
            {chapters.map((chapter) => (
              <button
                type="button"
                key={getId(chapter)}
                className={`studio-tree-item ${selectedChapter === getId(chapter) ? 'is-active' : ''}`}
                onClick={() => setSelectedChapter(getId(chapter))}
              >
                {chapter.title}
              </button>
            ))}
            {!chapters.length && selectedSubject && loadingSection !== 'chapters' && (
              <p className="studio-muted">No chapters yet.</p>
            )}
          </div>
        </aside>

        <section className="course-studio-main">
          <div className="studio-breadcrumb">
            {courseTitle || 'Select a course'} <span>/</span> {subjectTitle || 'Select a subject'}{' '}
            <span>/</span> {chapterTitle || 'Select a chapter'}
          </div>

          {/* 1. Chapter Video Lectures & Bulk YouTube Playlist Import */}
          <div className="studio-lessons card">
            <div className="studio-panel-heading" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span className="admin-kicker">Chapter video lectures</span>
                <h2>Lessons ({lessons.length})</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={!selectedCourse}
                  onClick={() => {
                    setPlaylistUrlInput('');
                    setPreviewVideos([]);
                    setPlaylistModalOpen(true);
                  }}
                  style={{ color: '#dc2626', borderColor: 'rgba(220,38,38,0.35)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <FiYoutube /> Bulk Import Playlist
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!selectedChapter}
                  onClick={() => {
                    setSelectedLesson('');
                    setLessonForm({
                      ...emptyLesson,
                      order: lessons.length + 1,
                      classNumber: lessons.length + 1,
                    });
                  }}
                >
                  <FiPlus /> New lesson
                </button>
              </div>
            </div>
            {!selectedChapter && (
              <div className="studio-empty">
                Choose a chapter (or click &ldquo;Bulk Import Playlist&rdquo; to auto-create one from a YouTube playlist).
              </div>
            )}
            {loadingSection === 'lessons' && <div className="studio-empty">Loading lessons...</div>}
            {selectedChapter && loadingSection !== 'lessons' && !lessons.length && (
              <div className="studio-empty">
                No lessons yet. Click &ldquo;Bulk Import Playlist&rdquo; or &ldquo;New lesson&rdquo; above.
              </div>
            )}
            <div className="studio-lesson-list">
              {lessons.map((lesson, index) => (
                <button
                  type="button"
                  key={getId(lesson)}
                  className={`studio-lesson-row ${selectedLesson === getId(lesson) ? 'is-active' : ''}`}
                  onClick={() => selectLesson(lesson)}
                >
                  <span className="studio-lesson-number">{lesson.order || index + 1}</span>
                  <span>
                    <strong>{lesson.title}</strong>
                    <small>
                      {lesson.videoUrl ? 'YouTube Video attached' : 'No video attached'} ·{' '}
                      {lesson.duration || '30:00'} · {lesson.isFree ? 'Free preview' : 'Protected'}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Course, Chapter & Lesson Study Notes Upload Panel (Always visible when a course is selected!) */}
          {selectedCourse && (
            <div className="card" style={{ marginTop: '1.25rem' }}>
              <div className="studio-panel-heading" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span className="admin-kicker">Google Drive Study Materials</span>
                  <h2>Upload & Manage PDF Notes (Course / Chapter / Lesson)</h2>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'var(--bg-muted)', padding: '0.25rem', borderRadius: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setNoteTab('chapter')}
                    className={`btn btn-sm ${noteTab === 'chapter' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ border: 'none', fontSize: '0.78rem' }}
                  >
                    Chapter Notes ({chapterNotes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteTab('course')}
                    className={`btn btn-sm ${noteTab === 'course' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ border: 'none', fontSize: '0.78rem' }}
                  >
                    Course Notes ({courseNotes.length})
                  </button>
                  {selectedLesson && (
                    <button
                      type="button"
                      onClick={() => setNoteTab('lesson')}
                      className={`btn btn-sm ${noteTab === 'lesson' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ border: 'none', fontSize: '0.78rem' }}
                    >
                      Lesson Notes ({lessonNotes.length})
                    </button>
                  )}
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.84rem',
                  color: 'var(--text-muted)',
                  marginBottom: '0.85rem',
                }}
              >
                Target Scope:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {noteTab === 'chapter'
                    ? `Chapter — ${chapterTitle || 'Select a chapter'}`
                    : noteTab === 'course'
                    ? `Entire Course — ${courseTitle}`
                    : `Lesson — ${lessonForm.title || 'Selected Lesson'}`}
                </strong>
              </div>

              {/* Direct Multi-PDF Upload to Google Drive */}
              <form
                onSubmit={uploadNotesToDrive}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  padding: '0.9rem',
                  backgroundColor: 'var(--bg-muted)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: '1 1 200px' }}
                  placeholder="Study note title (optional for multi-PDF)"
                  value={newPdfTitle}
                  onChange={(e) => setNewPdfTitle(e.target.value)}
                />
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  multiple
                  className="form-input"
                  style={{ flex: '1 1 220px' }}
                  onChange={(e) => setNewPdfFiles(Array.from(e.target.files || []))}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newPdfIsFree}
                    onChange={(e) => setNewPdfIsFree(e.target.checked)}
                  />
                  Free PDF
                </label>
                {!newPdfIsFree && (
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    style={{ width: '90px' }}
                    placeholder="₹ Price"
                    value={newPdfPrice}
                    onChange={(e) => setNewPdfPrice(e.target.value)}
                  />
                )}
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={newPdfFiles.length === 0 || uploadingToDrive || (noteTab === 'chapter' && !selectedChapter)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <FiCloud />{' '}
                  {uploadingToDrive
                    ? 'Uploading to GDrive...'
                    : `Upload ${newPdfFiles.length > 1 ? `${newPdfFiles.length} PDFs` : 'PDF'} to Google Drive`}
                </button>
              </form>

              {/* Attach Existing Google Drive PDF */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  style={{ flex: 1, minWidth: '240px' }}
                  value={selectedNoteId}
                  onChange={(e) => setSelectedNoteId(e.target.value)}
                >
                  <option value="">Or link an existing Google Drive PDF to this {noteTab}</option>
                  {notes.map((note) => (
                    <option key={getId(note)} value={getId(note)}>
                      {note.title} {note.isFree ? '(Free)' : `(₹${note.price || 0})`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={!selectedNoteId || resourceSaving}
                  onClick={attachNote}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <FiPlus /> {resourceSaving ? 'Linking...' : `Link to ${noteTab}`}
                </button>
              </div>

              {activeNotesList.length === 0 ? (
                <p className="studio-muted" style={{ margin: 0, padding: '0.5rem 0' }}>
                  No study materials attached to this {noteTab} yet. Upload one or more PDFs above to save directly to Google Drive.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {activeNotesList.map((note) => {
                    const driveUrl = getNoteDriveViewUrl(note);
                    return (
                      <div
                        key={getId(note)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.7rem 1rem',
                          backgroundColor: 'var(--bg-muted)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          flexWrap: 'wrap',
                          gap: '0.5rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <FiBookOpen style={{ color: 'var(--primary)', fontSize: '1.1rem' }} />
                          <div>
                            <strong>{note.title}</strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                              {note.isFree ? 'Free access' : `₹${note.price || 0}`} •{' '}
                              {note.chapterTitle ? `Chapter: ${note.chapterTitle}` : 'Course PDF'} • Saved in Google Drive
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {driveUrl && (
                            <a
                              href={driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline btn-sm"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <FiExternalLink /> Open in GDrive
                            </a>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{
                              color: '#ef4444',
                              borderColor: 'rgba(239, 68, 68, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                            disabled={resourceSaving}
                            onClick={() => handleRemoveNote(getId(note))}
                            title="Delete note"
                          >
                            <FiTrash2 /> Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Single Lesson Editor */}
          {selectedChapter && (selectedLesson || !lessons.length) && (
            <form className="lesson-editor card" onSubmit={saveLesson} style={{ marginTop: '1.25rem' }}>
              <div className="studio-panel-heading">
                <div>
                  <span className="admin-kicker">Lesson editor</span>
                  <h2>{selectedLesson ? 'Edit lesson' : 'Create single lesson'}</h2>
                </div>
                {selectedLesson && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={removeLesson}
                    disabled={Boolean(deletingId)}
                  >
                    <FiTrash2 /> {deletingId ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Lesson title</label>
                  <input
                    required
                    className="form-input"
                    value={lessonForm.title || ''}
                    onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })}
                    placeholder="e.g. LEC 01 Chemical Kinetics"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">YouTube video URL</label>
                  <input
                    className="form-input"
                    value={lessonForm.videoUrl || ''}
                    onChange={(event) => setLessonForm({ ...lessonForm, videoUrl: event.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">What will students learn?</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={lessonForm.description || ''}
                  onChange={(event) => setLessonForm({ ...lessonForm, description: event.target.value })}
                />
              </div>
              <div className="grid-4">
                <div className="form-group">
                  <label className="form-label">Duration (MM:SS or mins)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={lessonForm.duration ?? ''}
                    onChange={(event) => setLessonForm({ ...lessonForm, duration: event.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Lesson order</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={lessonForm.order ?? ''}
                    onChange={(event) => setLessonForm({ ...lessonForm, order: event.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Class number</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={lessonForm.classNumber ?? ''}
                    onChange={(event) => setLessonForm({ ...lessonForm, classNumber: event.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Class date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={lessonForm.classDate ? String(lessonForm.classDate).slice(0, 10) : ''}
                    onChange={(event) => setLessonForm({ ...lessonForm, classDate: event.target.value })}
                  />
                </div>
              </div>
              <div className="lesson-editor-options">
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(lessonForm.isFree)}
                    onChange={(event) =>
                      setLessonForm({
                        ...lessonForm,
                        isFree: event.target.checked,
                        isProtected: event.target.checked ? false : lessonForm.isProtected,
                      })
                    }
                  />{' '}
                  Free preview
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(lessonForm.isProtected)}
                    onChange={(event) =>
                      setLessonForm({
                        ...lessonForm,
                        isProtected: event.target.checked,
                        isFree: event.target.checked ? false : lessonForm.isFree,
                      })
                    }
                  />{' '}
                  Protected lesson
                </label>
              </div>
              <div className="curriculum-form-actions">
                <button type="submit" className="btn btn-primary" disabled={lessonSaving}>
                  <FiSave /> {lessonSaving ? 'Saving...' : 'Save lesson'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {/* Add Subject / Chapter Modal */}
      {modal && (
        <Modal
          isOpen
          closeDisabled={submitting}
          title={`Add ${modal}`}
          onClose={() => setModal(null)}
        >
          <form onSubmit={submitCreate} className="curriculum-form">
            <div className="form-group">
              <label className="form-label">{modal === 'subject' ? 'Subject name' : 'Chapter name'}</label>
              <input
                autoFocus
                required
                className="form-input"
                value={formValue.title}
                onChange={(event) => setFormValue({ ...formValue, title: event.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                rows="4"
                value={formValue.description}
                onChange={(event) => setFormValue({ ...formValue, description: event.target.value })}
              />
            </div>
            <div className="curriculum-form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setModal(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Creating...' : `Create ${modal}`}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Bulk YouTube Playlist Importer Modal */}
      <Modal
        isOpen={playlistModalOpen}
        onClose={() => setPlaylistModalOpen(false)}
        closeDisabled={importingPlaylist || fetchingPlaylist}
        title={`Bulk Import YouTube Playlist into ${chapterTitle || courseTitle || 'Course'}`}
        size="lg"
      >
        <form onSubmit={handleImportPlaylistIntoStudio} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 700 }}>
              Paste YouTube Playlist URL (or newline-separated YouTube Video URLs)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                placeholder="https://www.youtube.com/playlist?list=PLKsilHHi-1ZQ"
                value={playlistUrlInput}
                onChange={(e) => setPlaylistUrlInput(e.target.value)}
              />
              <button
                type="button"
                disabled={fetchingPlaylist}
                onClick={() => handlePreviewPlaylistInStudio()}
                className="btn btn-primary"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
              >
                {fetchingPlaylist ? 'Fetching...' : 'Fetch Videos'}
              </button>
            </div>
          </div>

          <div>
            <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
              Or 1-Click Load from @Sidacademyprayagraj Playlists:
            </small>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {QUICK_PLAYLISTS.map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  disabled={fetchingPlaylist}
                  onClick={() => {
                    const url = `https://www.youtube.com/playlist?list=${pl.id}`;
                    setPlaylistUrlInput(url);
                    handlePreviewPlaylistInStudio(url);
                  }}
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem' }}
                >
                  {pl.title}
                </button>
              ))}
            </div>
          </div>

          {previewVideos.length > 0 && (
            <div
              style={{
                maxHeight: '260px',
                overflowY: 'auto',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
              }}
            >
              <strong>
                {previewVideos.length} Videos Ready to Import (Arranged in Exact Playlist Order):
              </strong>
              {previewVideos.map((v, i) => (
                <div
                  key={`${v.videoId}-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.4rem 0.6rem',
                    backgroundColor: 'var(--bg-muted)',
                    borderRadius: '6px',
                    fontSize: '0.84rem',
                  }}
                >
                  <strong style={{ color: 'var(--primary)' }}>#{i + 1}</strong>
                  <img
                    src={v.thumbnailUrl}
                    alt={v.title}
                    style={{ width: '48px', height: '30px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.title}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{v.duration}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setPlaylistModalOpen(false)}
              className="btn btn-outline"
              disabled={importingPlaylist}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={importingPlaylist || (!playlistUrlInput.trim() && previewVideos.length === 0)}
              className="btn btn-primary"
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 700 }}
            >
              {importingPlaylist
                ? 'Importing Videos...'
                : `Import ${previewVideos.length || ''} Videos in Order`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CurriculumPage;
