import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAllCourses } from '../../api/courseApi';
import { getSubjectsByCourse, getChaptersBySubject, getClassesByChapter, createSubject, createChapter, createClass, updateClass, deleteClass } from '../../api/adminApi';
import { getAllNotes, updateNote } from '../../api/noteApi';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiBook, FiFolder, FiList, FiPlus, FiTrash2, FiSave, FiAlertCircle, FiBookOpen } from 'react-icons/fi';
import toast from 'react-hot-toast';

const getList = (response, key) => {
  const data = response.data?.data || response.data || {};
  return data[key] || (Array.isArray(data) ? data : []);
};

const getId = (item) => item?.id || item?._id || '';

const emptyLesson = {
  title: '', description: '', classDate: '', duration: 60, order: 1,
  classNumber: 1, videoUrl: '', videoProvider: 'youtube', isFree: true, isProtected: false,
};

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
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [resourceSaving, setResourceSaving] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const list = getList(await getAllCourses({ limit: 100 }), 'courses');
      setCourses(list);
      const urlCourseId = searchParams.get('courseId');
      const preferredId = (urlCourseId && list.some(c => getId(c) === urlCourseId)) 
        ? urlCourseId 
        : (selectedCourse || getId(list[0]));
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
    } finally { setLoadingSection(''); }
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
    } finally { setLoadingSection(''); }
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
      setLessonForm(nextLesson ? { ...emptyLesson, ...nextLesson } : { ...emptyLesson, order: list.length + 1, classNumber: list.length + 1 });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load lessons.');
    } finally { setLoadingSection(''); }
  };

  useEffect(() => { loadCourses(); loadNotes(); }, []);
  useEffect(() => {
    setSelectedSubject(''); setSelectedChapter(''); setSelectedLesson('');
    setSubjects([]); setChapters([]); setLessons([]); loadSubjects(selectedCourse);
  }, [selectedCourse]);
  useEffect(() => {
    setSelectedChapter(''); setSelectedLesson(''); setChapters([]); setLessons([]); loadChapters(selectedSubject);
  }, [selectedSubject]);
  useEffect(() => {
    setSelectedLesson(''); setLessons([]); loadLessons(selectedChapter);
  }, [selectedChapter]);

  const selectLesson = (lesson) => {
    setSelectedLesson(getId(lesson));
    setLessonForm({ ...emptyLesson, ...lesson });
  };

  const attachedNotes = notes.filter((note) => (note.lessonId || note.lesson_id) === selectedLesson);

  const attachNote = async () => {
    if (!selectedNoteId || !selectedLesson || resourceSaving) return;
    setResourceSaving(true);
    try {
      await updateNote(selectedNoteId, {
        lessonId: selectedLesson,
        courseId: selectedCourse || null,
        subjectId: selectedSubject || null,
        chapterId: selectedChapter || null,
      });
      toast.success('Study material attached to lesson');
      setSelectedNoteId('');
      await loadNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not attach study material');
    } finally {
      setResourceSaving(false);
    }
  };

  const detachNote = async (noteId) => {
    if (resourceSaving) return;
    setResourceSaving(true);
    try {
      await updateNote(noteId, { lessonId: null });
      toast.success('Study material detached');
      await loadNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not detach study material');
    } finally {
      setResourceSaving(false);
    }
  };

  const openCreate = (type) => { setFormValue({ title: '', description: '' }); setModal(type); };

  const submitCreate = async (event) => {
    event.preventDefault();
    if (submitting || !formValue.title.trim()) return;
    setSubmitting(true);
    try {
      if (modal === 'subject') {
        const response = await createSubject({ name: formValue.title.trim(), description: formValue.description, courseId: selectedCourse });
        await loadSubjects(selectedCourse, getId(response.data?.data?.subject));
      } else {
        const response = await createChapter({ title: formValue.title.trim(), content: formValue.description, subjectId: selectedSubject });
        await loadChapters(selectedSubject, getId(response.data?.data?.chapter));
      }
      toast.success(`${modal} created`); setModal(null);
    } catch (err) { toast.error(err.response?.data?.message || `Could not create ${modal}`); }
    finally { setSubmitting(false); }
  };

  const saveLesson = async (event) => {
    event.preventDefault();
    if (!lessonForm.title.trim() || lessonSaving) return;
    setLessonSaving(true);
    try {
      const payload = { ...lessonForm, chapterId: selectedChapter, duration: Number(lessonForm.duration) || 0, order: Number(lessonForm.order) || 1, classNumber: Number(lessonForm.classNumber) || 1 };
      const response = selectedLesson ? await updateClass(selectedLesson, payload) : await createClass(payload);
      const saved = response.data?.data?.lesson || response.data?.data?.dailyClass;
      toast.success(selectedLesson ? 'Lesson updated' : 'Lesson created');
      await loadLessons(selectedChapter, getId(saved));
      await loadNotes();
    } catch (err) { toast.error(err.response?.data?.message || 'Could not save lesson'); }
    finally { setLessonSaving(false); }
  };

  const removeLesson = async () => {
    if (!selectedLesson || deletingId) return;
    setDeletingId(selectedLesson);
    try { await deleteClass(selectedLesson); toast.success('Lesson deleted'); await loadLessons(selectedChapter); }
    catch (err) { toast.error(err.response?.data?.message || 'Could not delete lesson'); }
    finally { setDeletingId(null); }
  };

  if (loading) return <Loader fullPage label="Loading Course Studio" />;

  const courseTitle = courses.find((course) => getId(course) === selectedCourse)?.title;
  const subjectTitle = subjects.find((subject) => getId(subject) === selectedSubject)?.name || subjects.find((subject) => getId(subject) === selectedSubject)?.title;
  const chapterTitle = chapters.find((chapter) => getId(chapter) === selectedChapter)?.title;

  return (
    <div className="admin-curriculum-page">
      <div className="admin-page-heading">
        <div><span className="admin-kicker">Teacher workspace</span><h1>Course Studio</h1><p>Build the course students will see: subjects, chapters, lessons, videos, and access rules.</p></div>
        <Link to="/admin/courses" className="btn btn-outline btn-sm"><FiBook /> Manage courses</Link>
      </div>
      {error && <div className="admin-inline-error"><FiAlertCircle /> {error}<button type="button" onClick={() => setError('')}>Dismiss</button></div>}

      <div className="course-studio-layout">
        <aside className="course-studio-tree card">
          <div className="studio-panel-heading"><div><span className="admin-kicker">Course</span><h2>Curriculum tree</h2></div></div>
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
          <div className="studio-tree-section"><div className="studio-tree-label"><FiFolder /> Subjects <button type="button" onClick={() => openCreate('subject')} disabled={!selectedCourse} title="Add subject"><FiPlus /></button></div>{loadingSection === 'subjects' && <p className="studio-muted">Loading subjects...</p>}{subjects.map((subject) => <button type="button" key={getId(subject)} className={`studio-tree-item ${selectedSubject === getId(subject) ? 'is-active' : ''}`} onClick={() => setSelectedSubject(getId(subject))}>{subject.name || subject.title}</button>)}{!subjects.length && selectedCourse && loadingSection !== 'subjects' && <p className="studio-muted">No subjects yet.</p>}</div>
          <div className="studio-tree-section"><div className="studio-tree-label"><FiList /> Chapters <button type="button" onClick={() => openCreate('chapter')} disabled={!selectedSubject} title="Add chapter"><FiPlus /></button></div>{loadingSection === 'chapters' && <p className="studio-muted">Loading chapters...</p>}{chapters.map((chapter) => <button type="button" key={getId(chapter)} className={`studio-tree-item ${selectedChapter === getId(chapter) ? 'is-active' : ''}`} onClick={() => setSelectedChapter(getId(chapter))}>{chapter.title}</button>)}{!chapters.length && selectedSubject && loadingSection !== 'chapters' && <p className="studio-muted">No chapters yet.</p>}</div>
        </aside>

        <section className="course-studio-main">
          <div className="studio-breadcrumb">{courseTitle || 'Select a course'} <span>/</span> {subjectTitle || 'Select a subject'} <span>/</span> {chapterTitle || 'Select a chapter'}</div>
          <div className="studio-lessons card"><div className="studio-panel-heading"><div><span className="admin-kicker">Chapter content</span><h2>Lessons</h2></div><button type="button" className="btn btn-primary btn-sm" disabled={!selectedChapter} onClick={() => { setSelectedLesson(''); setLessonForm({ ...emptyLesson, order: lessons.length + 1, classNumber: lessons.length + 1 }); }}><FiPlus /> New lesson</button></div>{!selectedChapter && <div className="studio-empty">Choose a chapter to manage its lessons.</div>}{loadingSection === 'lessons' && <div className="studio-empty">Loading lessons...</div>}{selectedChapter && loadingSection !== 'lessons' && !lessons.length && <div className="studio-empty">No lessons yet. Create the first lesson for this chapter.</div>}<div className="studio-lesson-list">{lessons.map((lesson, index) => <button type="button" key={getId(lesson)} className={`studio-lesson-row ${selectedLesson === getId(lesson) ? 'is-active' : ''}`} onClick={() => selectLesson(lesson)}><span className="studio-lesson-number">{lesson.order || index + 1}</span><span><strong>{lesson.title}</strong><small>{lesson.videoUrl ? 'Video attached' : 'No video attached'} · {lesson.isFree ? 'Free preview' : 'Protected'}</small></span></button>)}</div></div>

          {selectedChapter && (selectedLesson || !lessons.length) && (
            <form className="lesson-editor card" onSubmit={saveLesson}>
              <div className="studio-panel-heading">
                <div>
                  <span className="admin-kicker">Lesson editor</span>
                  <h2>{selectedLesson ? 'Edit lesson' : 'Create lesson'}</h2>
                </div>
                {selectedLesson && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={removeLesson} disabled={Boolean(deletingId)}>
                    <FiTrash2 /> {deletingId ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Lesson title</label>
                  <input required className="form-input" value={lessonForm.title || ''} onChange={(event) => setLessonForm({ ...lessonForm, title: event.target.value })} placeholder="e.g. Introduction to chemical kinetics" />
                </div>
                <div className="form-group">
                  <label className="form-label">YouTube video URL</label>
                  <input className="form-input" value={lessonForm.videoUrl || ''} onChange={(event) => setLessonForm({ ...lessonForm, videoUrl: event.target.value })} placeholder="https://youtube.com/watch?v=..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">What will students learn?</label>
                <textarea className="form-textarea" rows="3" value={lessonForm.description || ''} onChange={(event) => setLessonForm({ ...lessonForm, description: event.target.value })} />
              </div>
              <div className="grid-4">
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input type="number" min="0" className="form-input" value={lessonForm.duration ?? ''} onChange={(event) => setLessonForm({ ...lessonForm, duration: event.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Lesson order</label>
                  <input type="number" min="1" className="form-input" value={lessonForm.order ?? ''} onChange={(event) => setLessonForm({ ...lessonForm, order: event.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Class number</label>
                  <input type="number" min="1" className="form-input" value={lessonForm.classNumber ?? ''} onChange={(event) => setLessonForm({ ...lessonForm, classNumber: event.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Class date</label>
                  <input type="date" className="form-input" value={lessonForm.classDate ? String(lessonForm.classDate).slice(0, 10) : ''} onChange={(event) => setLessonForm({ ...lessonForm, classDate: event.target.value })} />
                </div>
              </div>
              <div className="lesson-editor-options">
                <label><input type="checkbox" checked={Boolean(lessonForm.isFree)} onChange={(event) => setLessonForm({ ...lessonForm, isFree: event.target.checked, isProtected: event.target.checked ? false : lessonForm.isProtected })} /> Free preview</label>
                <label><input type="checkbox" checked={Boolean(lessonForm.isProtected)} onChange={(event) => setLessonForm({ ...lessonForm, isProtected: event.target.checked, isFree: event.target.checked ? false : lessonForm.isFree })} /> Protected lesson</label>
              </div>
              <div className="curriculum-form-actions">
                <button type="submit" className="btn btn-primary" disabled={lessonSaving}>
                  <FiSave /> {lessonSaving ? 'Saving...' : 'Save lesson'}
                </button>
              </div>
            </form>
          )}

          {selectedLesson && (
            <div className="card" style={{ marginTop: '1.25rem' }}>
              <div className="studio-panel-heading">
                <div>
                  <span className="admin-kicker">Study resources</span>
                  <h2>Lesson Study Materials & PDFs</h2>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <select
                  className="form-select"
                  style={{ flex: 1, minWidth: '240px' }}
                  value={selectedNoteId}
                  onChange={(e) => setSelectedNoteId(e.target.value)}
                >
                  <option value="">Select a study material / PDF to attach</option>
                  {notes.map((note) => (
                    <option key={getId(note)} value={getId(note)}>
                      {note.title} {note.isFree ? '(Free)' : `(₹${note.price || 0})`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!selectedNoteId || resourceSaving}
                  onClick={attachNote}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <FiPlus /> {resourceSaving ? 'Attaching...' : 'Attach to Lesson'}
                </button>
              </div>

              {attachedNotes.length === 0 ? (
                <p className="studio-muted" style={{ margin: 0, padding: '0.5rem 0' }}>
                  No study materials attached to this lecture yet. Select an uploaded PDF above to attach it.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {attachedNotes.map((note) => (
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
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <FiBookOpen style={{ color: 'var(--primary)', fontSize: '1.1rem' }} />
                        <div>
                          <strong>{note.title}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                            {note.isFree ? 'Free access' : `₹${note.price || 0}`}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        disabled={resourceSaving}
                        onClick={() => detachNote(getId(note))}
                        title="Detach from this lesson"
                      >
                        <FiTrash2 /> Detach
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {modal && <Modal isOpen closeDisabled={submitting} title={`Add ${modal}`} onClose={() => setModal(null)}><form onSubmit={submitCreate} className="curriculum-form"><div className="form-group"><label className="form-label">{modal === 'subject' ? 'Subject name' : 'Chapter name'}</label><input autoFocus required className="form-input" value={formValue.title} onChange={(event) => setFormValue({ ...formValue, title: event.target.value })} /></div><div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows="4" value={formValue.description} onChange={(event) => setFormValue({ ...formValue, description: event.target.value })} /></div><div className="curriculum-form-actions"><button type="button" className="btn btn-outline" onClick={() => setModal(null)} disabled={submitting}>Cancel</button><button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : `Create ${modal}`}</button></div></form></Modal>}
    </div>
  );
};

export default CurriculumPage;
