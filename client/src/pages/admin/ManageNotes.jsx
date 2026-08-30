import React, { useState, useEffect } from 'react';
import { getAllNotes, createNote, updateNote, deleteNote, getSecureAccess } from '../../api/noteApi';
import { getAllCourses } from '../../api/courseApi';
import { getSubjectsByCourse, getChaptersBySubject } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiTrash2, FiPlus, FiEdit2, FiEye, FiFileText, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/helpers';

const ManageNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewPdf, setPreviewPdf] = useState(null);

  // Cascading hierarchy dropdowns
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState('');

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
      const res = await getAllCourses();
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
        if (list.length > 0) setSelectedSubject(list[0].id || list[0]._id);
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
        if (list.length > 0) setSelectedChapter(list[0].id || list[0]._id);
      } catch (err) {
        console.warn('Failed to load chapters:', err);
      }
    };
    fetchChaps();
  }, [selectedSubject]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setSelectedFile(null);
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
      fileUrl: note.fileUrl || '',
    });
    setSelectedCourse(note.courseId || '');
    setSelectedSubject(note.subjectId || '');
    setSelectedChapter(note.chapterId || '');
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
      if (editingId) {
        const payload = {
          ...formData,
          courseId: selectedCourse || null,
          subjectId: selectedSubject || null,
          chapterId: selectedChapter || null,
        };
        await updateNote(editingId, payload);
        toast.success('Note metadata updated successfully');
      } else {
        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('price', formData.isFree ? 0 : formData.price);
        data.append('isFree', formData.isFree);
        data.append('isPublished', formData.isPublished);
        data.append('pageCount', formData.pageCount);
        if (selectedCourse) data.append('courseId', selectedCourse);
        if (selectedSubject) data.append('subjectId', selectedSubject);
        if (selectedChapter) data.append('chapterId', selectedChapter);
        if (formData.fileUrl) data.append('fileUrl', formData.fileUrl);

        if (selectedFile) {
          data.append('file', selectedFile);
        }

        await createNote(data);
        toast.success('Digital note created successfully');
      }

      setIsModalOpen(false);
      fetchNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving note metadata');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this digital note?')) {
      try {
        await deleteNote(id);
        toast.success('Note deleted successfully');
        fetchNotes();
      } catch (err) {
        toast.error('Error deleting note');
      }
    }
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Manage Digital Notes & Study PDFs</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            Upload, set free/paid pricing, assign academic hierarchy, and control PDF downloads.
          </p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiPlus /> Add Study Note
        </button>
      </div>

      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Note Title</th>
                <th>Subject & Chapter</th>
                <th>Access / Price</th>
                <th>Pages</th>
                <th>Downloads</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <FiFileText size={36} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                    <p>No digital notes created yet. Click "Add Study Note" to upload.</p>
                  </td>
                </tr>
              ) : (
                notes.map((note) => {
                  const id = note.id || note._id;
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
                              {note.fileName || 'document.pdf'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>{note.subjectTitle || 'General'}</span>
                        <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {note.chapterTitle || 'Standard Notes'}
                        </span>
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
                        {note.pageCount || 24} pgs
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {note.downloadsCount || 0}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => handlePreviewPdf(note)}
                            className="btn btn-sm btn-outline"
                            title="Preview PDF"
                          >
                            <FiEye size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(note)}
                            className="btn btn-sm btn-outline"
                            title="Edit Note"
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(id)}
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
        title={editingId ? 'Edit Digital Note' : 'Upload Digital Note'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Note Title *</label>
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
              Academic Hierarchy Association
            </h4>
            <div className="grid-3" style={{ gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Course</label>
                <select
                  className="form-input"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
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
                  onChange={(e) => setSelectedSubject(e.target.value)}
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
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  disabled={!selectedSubject}
                >
                  <option value="">-- Select Chapter --</option>
                  {chapters.map((ch) => (
                    <option key={ch._id || ch.id} value={ch._id || ch.id}>{ch.title}</option>
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
                className="form-input"
                disabled={formData.isFree}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                />
                <span>Free Access</span>
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

          {/* PDF File / URL */}
          {!editingId && (
            <div className="form-group">
              <label className="form-label">PDF File Upload</label>
              <input
                type="file"
                accept=".pdf"
                className="form-input"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              {selectedFile && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--accent-dark)' }}>
                  ✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          )}

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
              {submitting ? 'Saving...' : editingId ? 'Update Note' : 'Upload Note'}
            </button>
          </div>
        </form>
      </Modal>

      {/* PDF Modal Previewer */}
      {previewPdf && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewPdf(null)}
        >
          <div
            className="modal-box"
            style={{ maxWidth: '900px', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{previewPdf.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {previewPdf.fileName} • {previewPdf.fileSize || '2.5 MB'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={previewPdf.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <FiExternalLink size={14} /> Open External
                </a>
                <button onClick={() => setPreviewPdf(null)} className="btn btn-sm btn-outline">
                  Close
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
              <iframe
                src={previewPdf.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                title={previewPdf.title}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageNotes;
