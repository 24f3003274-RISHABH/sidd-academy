import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllNotes, createNote, updateNote, deleteNote, getSecureAccess } from '../../api/noteApi';
import { getAllCourses, getLessonsByChapter } from '../../api/courseApi';
import { getSubjectsByCourse, getChaptersBySubject } from '../../api/adminApi';
import { clearGetCache } from '../../api/axiosInstance';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import PdfPreviewModal from '../../components/notes/PdfPreviewModal';
import { FiTrash2, FiPlus, FiEdit2, FiEye, FiEyeOff, FiCheckCircle, FiFileText, FiExternalLink, FiCloud, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  formatPrice,
  getNoteDriveViewUrl,
} from '../../utils/helpers';

const ManageNotes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [previewPdf, setPreviewPdf] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [pricingFilter, setPricingFilter] = useState('all'); // 'all' | 'free' | 'paid'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'
  const [courseFilter, setCourseFilter] = useState('');

  // Cascading hierarchy dropdowns
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState('');

  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    isFree: false,
    isPublished: true,
    pageCount: 24,
    fileUrl: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await getAllNotes();
      const list = res.data?.data?.notes || res.data?.notes || (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
      setNotes(list);
    } catch (err) {
      toast.error('Failed to fetch digital notes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await getAllCourses({ limit: 100 });
      const list = res.data?.data?.courses || res.data?.courses || (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
      setCourses(list);
    } catch (err) {
      console.warn('Failed to load courses:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenCreateModal();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  // When selectedCourse changes, fetch subjects
  useEffect(() => {
    if (!selectedCourse) {
      setSubjects([]);
      setSelectedSubject('');
      return;
    }
    const fetchSubjs = async () => {
      try {
        const res = await getSubjectsByCourse(selectedCourse);
        const list = res.data?.data?.subjects || res.data?.subjects || (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
        setSubjects(list);
      } catch (err) {
        console.warn('Failed to load subjects:', err);
      }
    };
    fetchSubjs();
  }, [selectedCourse]);

  // When selectedSubject changes, fetch chapters
  useEffect(() => {
    if (!selectedSubject) {
      setChapters([]);
      setSelectedChapter('');
      return;
    }
    const fetchChaps = async () => {
      try {
        const res = await getChaptersBySubject(selectedSubject);
        const list = res.data?.data?.chapters || res.data?.chapters || (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
        setChapters(list);
      } catch (err) {
        console.warn('Failed to load chapters:', err);
      }
    };
    fetchChaps();
  }, [selectedSubject]);

  // When selectedChapter changes, fetch lessons
  useEffect(() => {
    if (!selectedChapter) {
      setLessons([]);
      setSelectedLesson('');
      return;
    }
    const fetchLess = async () => {
      try {
        const res = await getLessonsByChapter(selectedChapter);
        const list = res.data?.data?.lessons || res.data?.data?.dailyClasses || res.data?.lessons || [];
        setLessons(list);
      } catch (err) {
        console.warn('Failed to load lessons:', err);
      }
    };
    fetchLess();
  }, [selectedChapter]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setSelectedFile(null);
    setSelectedCourse('');
    setSelectedSubject('');
    setSelectedChapter('');
    setSelectedLesson('');
    setFormData({
      title: '',
      description: '',
      price: 0,
      isFree: false,
      isPublished: true,
      pageCount: 24,
      fileUrl: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (note) => {
    setEditingId(note.id || note._id);
    setSelectedFile(null);
    setFormData({
      title: note.title || '',
      description: note.description || '',
      price: note.price || 0,
      isFree: note.isFree || false,
      isPublished: note.isPublished !== undefined ? note.isPublished : true,
      pageCount: note.pageCount || 24,
      fileUrl: note.driveViewUrl || note.fileUrl || '',
    });
    setSelectedCourse(note.courseId || '');
    setSelectedSubject(note.subjectId || '');
    setSelectedChapter(note.chapterId || '');
    setSelectedLesson(note.lessonId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Note title is required');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description || '');
      data.append('price', formData.isFree ? 0 : formData.price);
      data.append('isFree', formData.isFree);
      data.append('isPublished', formData.isPublished);
      data.append('pageCount', formData.pageCount || 24);
      if (selectedCourse) data.append('courseId', selectedCourse);
      if (selectedSubject) data.append('subjectId', selectedSubject);
      if (selectedChapter) data.append('chapterId', selectedChapter);
      if (selectedLesson) data.append('lessonId', selectedLesson);
      if (formData.fileUrl) data.append('fileUrl', formData.fileUrl);
      if (selectedFile) {
        data.append('file', selectedFile);
      }

      if (editingId) {
        await updateNote(editingId, selectedFile ? data : {
          ...formData,
          price: formData.isFree ? 0 : Number(formData.price) || 0,
          courseId: selectedCourse || null,
          subjectId: selectedSubject || null,
          chapterId: selectedChapter || null,
          lessonId: selectedLesson || null,
        });
        toast.success(selectedFile ? 'Study material & PDF updated successfully' : 'Study material updated successfully');
      } else {
        await createNote(data);
        toast.success('Study material uploaded and saved to Cloud PDF Storage!');
      }

      clearGetCache();
      setIsModalOpen(false);
      fetchNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving note metadata');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (noteObj) => {
    const id = noteObj.id || noteObj._id;
    if (busyId) return;
    setConfirmState({
      title: 'Delete Study Material?',
      message: `Are you sure you want to permanently delete "${noteObj.title}"? Students will no longer be able to access or download this PDF.`,
      confirmText: 'Delete PDF Note',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setBusyId(id);
        try {
          await deleteNote(id);
          clearGetCache();
          toast.success('Note deleted successfully');
          fetchNotes();
        } catch (err) {
          toast.error('Error deleting note');
        } finally {
          setBusyId(null);
          setConfirmState(null);
        }
      },
    });
  };

  const handleTogglePublish = async (noteObj) => {
    const id = noteObj.id || noteObj._id;
    if (busyId) return;
    const nextPublished = noteObj.isPublished === false;
    setBusyId(id);
    try {
      await updateNote(id, { isPublished: nextPublished });
      clearGetCache();
      toast.success(nextPublished ? `"${noteObj.title}" is now Published` : `"${noteObj.title}" moved to Draft`);
      fetchNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update note visibility');
    } finally {
      setBusyId(null);
    }
  };

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notes.filter((note) => {
      const isPub = note.isPublished !== false;
      if (statusFilter === 'published' && !isPub) return false;
      if (statusFilter === 'draft' && isPub) return false;
      if (pricingFilter === 'free' && !note.isFree) return false;
      if (pricingFilter === 'paid' && note.isFree) return false;
      if (courseFilter && (note.courseId || note.course_id || '') !== courseFilter) return false;
      if (q) {
        const hay = `${note.title || ''} ${note.courseTitle || ''} ${note.subjectTitle || ''} ${note.chapterTitle || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [notes, searchQuery, pricingFilter, statusFilter, courseFilter]);

  const handlePreviewPdf = async (note) => {
    try {
      const res = await getSecureAccess(note.id || note._id);
      const data = res.data?.data || res.data;
      setPreviewPdf(data);
    } catch (err) {
      toast.error('Could not load PDF stream');
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Manage Study Materials (PDF)</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.88rem' }}>
            Upload handwritten notes, formula sheets, and chapter PDFs directly into durable Cloud Storage for instant student reading &amp; downloads.
          </p>
        </div>
        <button type="button" onClick={handleOpenCreateModal} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <FiPlus /> Upload Study PDF
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 250px', maxWidth: '380px' }}>
          <FiSearch style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.35rem' }}
            placeholder="Search notes by title, subject, or chapter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '175px', maxWidth: '240px' }}
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>
            ))}
          </select>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '125px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {['all', 'free', 'paid'].map((pf) => (
              <button
                key={pf}
                type="button"
                onClick={() => setPricingFilter(pf)}
                className={`btn btn-sm ${pricingFilter === pf ? 'btn-primary' : 'btn-outline'}`}
                style={{ borderRadius: '999px', padding: '0.32rem 0.75rem', fontSize: '0.78rem', textTransform: 'capitalize' }}
              >
                {pf}
              </button>
            ))}
          </div>
          {(searchQuery || courseFilter || pricingFilter !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => { setSearchQuery(''); setCourseFilter(''); setPricingFilter('all'); setStatusFilter('all'); }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Note Title ({filteredNotes.length})</th>
                <th>Course &amp; Subject</th>
                <th>PDF Storage</th>
                <th>Status</th>
                <th>Access / Price</th>
                <th>Downloads</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <FiFileText size={36} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>
                      {notes.length === 0
                        ? 'No study notes created yet. Click "Upload Study PDF" to upload.'
                        : 'No notes match your search or filter criteria.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredNotes.map((note) => {
                  const id = note.id || note._id;
                  const driveViewUrl = getNoteDriveViewUrl(note);
                  return (
                    <tr key={id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '6px',
                              backgroundColor: note.isFree ? 'var(--accent-subtle)' : 'var(--primary-subtle)',
                              color: note.isFree ? 'var(--accent-dark)' : 'var(--primary-dark)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <FiFileText size={18} />
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{note.title}</strong>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {note.fileName || 'document.pdf'} • {note.pageCount || 24} pgs • {note.fileSize || '2.5 MB'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>{note.courseTitle || note.subjectTitle || 'All Courses'}</span>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {note.subjectTitle || 'General'} {note.chapterTitle ? `• ${note.chapterTitle}` : ''}
                        </span>
                      </td>
                      <td>
                        {note.hasFileData || note.storageProvider === 'database' || note.storageProvider === 'database+gdrive' ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                            <FiCloud size={12} /> Cloud PDF Ready
                          </span>
                        ) : driveViewUrl ? (
                          <a
                            href={driveViewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="badge badge-success"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', textDecoration: 'none', fontSize: '0.75rem' }}
                            title="Open in Google Drive"
                          >
                            <FiCloud size={12} /> Google Drive <FiExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Re-upload PDF</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(note)}
                          disabled={busyId === id}
                          className={`badge ${note.isPublished !== false ? 'badge-success' : 'badge-outline'}`}
                          style={{ cursor: 'pointer', border: note.isPublished !== false ? 'none' : '1px solid var(--border)', fontSize: '0.75rem' }}
                          title={note.isPublished !== false ? 'Click to hide as Draft' : 'Click to Publish for students'}
                        >
                          {note.isPublished !== false ? <FiCheckCircle size={11} /> : <FiEyeOff size={11} />}
                          {busyId === id ? 'Saving...' : note.isPublished !== false ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td>
                        {note.isFree ? (
                          <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>FREE</span>
                        ) : (
                          <span className="badge badge-primary" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {formatPrice(note.price)}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {note.downloadCount ?? note.downloadsCount ?? 0}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => handlePreviewPdf(note)}
                            className="btn btn-sm btn-outline"
                            title="Preview PDF"
                          >
                            <FiEye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(note)}
                            className="btn btn-sm btn-outline"
                            title="Edit Note"
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(note)}
                            disabled={busyId === id}
                            className="btn btn-sm btn-danger"
                            title="Delete Note"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        closeDisabled={submitting}
        title={editingId ? 'Edit Study Material (PDF)' : 'Upload Study Material (PDF)'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Study Material Title *</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. PDF 1: Complete Formula Sheet & Solved Board Questions"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief summary of note contents, formulas, and target topics..."
            />
          </div>

          {/* Hierarchy Selection */}
          <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: 'var(--primary-dark)', fontWeight: 700 }}>
              Course Portal Association
            </h4>
            <div className="grid-2" style={{ gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Course</label>
                <select
                  className="form-input"
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value);
                    setSelectedSubject('');
                    setSelectedChapter('');
                    setSelectedLesson('');
                  }}
                >
                  <option value="">-- All Courses --</option>
                  {courses.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Subject</label>
                <select
                  className="form-input"
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedChapter('');
                    setSelectedLesson('');
                  }}
                  disabled={!selectedCourse}
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>{s.name || s.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Chapter</label>
                <select
                  className="form-input"
                  value={selectedChapter}
                  onChange={(e) => {
                    setSelectedChapter(e.target.value);
                    setSelectedLesson('');
                  }}
                  disabled={!selectedSubject}
                >
                  <option value="">-- Select Chapter --</option>
                  {chapters.map((ch) => (
                    <option key={ch._id || ch.id} value={ch._id || ch.id}>{ch.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Lesson / Lecture (Optional)</label>
                <select
                  className="form-input"
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  disabled={!selectedChapter}
                >
                  <option value="">-- Entire Chapter / Course --</option>
                  {lessons.map((l) => (
                    <option key={l._id || l.id} value={l._id || l.id}>{l.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & Free/Paid Status */}
          <div className="grid-3" style={{ gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Price (₹ INR)</label>
              <input
                type="number"
                min="0"
                className="form-input"
                disabled={formData.isFree}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={formData.isFree}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({ ...formData, isFree: checked, ...(checked ? { price: 0 } : {}) });
                  }}
                />
                <span>Free Access</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                />
                <span>Published (Live)</span>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Page Count</label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={formData.pageCount}
                onChange={(e) => setFormData({ ...formData, pageCount: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* PDF File Upload (Saved to Cloud Database) */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiCloud style={{ color: 'var(--primary)' }} />
              {editingId ? 'Replace PDF File (Optional, max 25 MB)' : 'Upload PDF File (Saved to Cloud Storage, max 25 MB)'}
            </label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              className="form-input"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            {selectedFile && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--accent-dark)' }}>
                ✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB) — ready for durable cloud upload
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Or External PDF / Google Drive Link (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              placeholder="https://drive.google.com/file/d/.../view"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Uploading PDF...' : editingId ? 'Update Study Material' : 'Upload & Save PDF'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmText={confirmState?.confirmText}
        confirmVariant={confirmState?.confirmVariant || 'danger'}
        loading={Boolean(busyId)}
        onConfirm={confirmState?.onConfirm}
        onCancel={() => !busyId && setConfirmState(null)}
      />

      {/* Unified PDF Modal Previewer */}
      {previewPdf && (
        <PdfPreviewModal
          note={previewPdf}
          onClose={() => setPreviewPdf(null)}
        />
      )}
    </div>
  );
};

export default ManageNotes;
