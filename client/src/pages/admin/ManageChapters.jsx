import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCourses } from '../../api/courseApi';
import { getSubjectsByCourse, getChaptersBySubject, createChapter, updateChapter, deleteChapter } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { FiEdit2, FiTrash2, FiPlus, FiFolder } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageChapters = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', videoUrl: '', subjectId: '' });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await getAllCourses({ limit: 100 });
        const list = res.data?.data?.courses || res.data?.courses || (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
        setCourses(list);
        if (list.length > 0 && !selectedCourse) {
          setSelectedCourse(list[0].id || list[0]._id);
        }
      } catch (err) {
        toast.error('Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      getSubjectsByCourse(selectedCourse)
        .then(res => {
          const list = res.data?.data?.subjects || res.data?.subjects || (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
          setSubjects(list);
          if (list.length > 0) {
            setSelectedSubject(list[0].id || list[0]._id);
          } else {
            setSelectedSubject('');
          }
        })
        .catch(() => {
          setSubjects([]);
          setSelectedSubject('');
        });
    } else {
      setSubjects([]);
      setSelectedSubject('');
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedSubject) {
      fetchChapters(selectedSubject);
    } else {
      setChapters([]);
    }
  }, [selectedSubject]);

  const fetchChapters = async (subjectId) => {
    setLoading(true);
    try {
      const res = await getChaptersBySubject(subjectId);
      const list = res.data?.data?.chapters || res.data?.chapters || (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
      setChapters(list);
    } catch (err) {
      toast.error('Failed to fetch chapters');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (chapter = null) => {
    if (!selectedSubject) {
      toast.error('Please select a subject first');
      return;
    }
    if (chapter) {
      setEditingId(chapter.id || chapter._id);
      setFormData({
        title: chapter.title || '',
        content: chapter.content || chapter.description || '',
        videoUrl: chapter.videoUrl || '',
        subjectId: selectedSubject,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        content: '',
        videoUrl: '',
        subjectId: selectedSubject,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateChapter(editingId, formData);
        toast.success('Chapter updated');
      } else {
        await createChapter(formData);
        toast.success('Chapter created');
      }
      setIsModalOpen(false);
      fetchChapters(selectedSubject);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving chapter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (chapter) => {
    const id = chapter.id || chapter._id;
    if (deletingId) return;
    setConfirmState({
      title: 'Delete Chapter?',
      message: `Permanently delete "${chapter.title}" and its lessons from this subject?`,
      confirmText: 'Delete Chapter',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await deleteChapter(id);
          toast.success('Chapter deleted');
          fetchChapters(selectedSubject);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Error deleting chapter');
        } finally {
          setDeletingId(null);
          setConfirmState(null);
        }
      },
    });
  };

  if (loading && courses.length === 0) return <Loader fullPage />;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Manage Chapters</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Create and edit chapters within a subject, or use Course Studio for full hierarchy editing.
          </p>
        </div>
        <Link to={selectedCourse ? `/admin/curriculum?courseId=${selectedCourse}` : '/admin/curriculum'} className="btn btn-outline btn-sm">
          <FiFolder size={14} /> Open in Course Studio
        </Link>
      </div>

      <div className="card grid-2" style={{ padding: '1.25rem', marginBottom: '1.5rem', gap: '1.25rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Select Course</label>
          <select className="form-select" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            <option value="">-- Select a Course --</option>
            {courses.map(c => {
              const cId = c.id || c._id;
              return (
                <option key={cId} value={cId}>{c.title}</option>
              );
            })}
          </select>
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Select Subject</label>
          <select className="form-select" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedCourse}>
            <option value="">-- Select a Subject --</option>
            {subjects.map(s => {
              const sId = s.id || s._id;
              return (
                <option key={sId} value={sId}>{s.name || s.title}</option>
              );
            })}
          </select>
        </div>
      </div>

      {selectedSubject && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Chapters ({chapters.length})</h2>
            <button type="button" onClick={() => openModal()} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiPlus /> Add Chapter
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Video Link</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {chapters.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No chapters found for this subject. Click &ldquo;Add Chapter&rdquo; to create one.</td></tr>
                ) : (
                  chapters.map(chapter => {
                    const chId = chapter.id || chapter._id;
                    return (
                      <tr key={chId}>
                        <td style={{ fontWeight: 600 }}>{chapter.title}</td>
                        <td>
                          <span className={`badge ${chapter.videoUrl ? 'badge-success' : 'badge-outline'}`}>
                            {chapter.videoUrl ? 'Attached' : 'None'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button type="button" onClick={() => openModal(chapter)} className="btn btn-sm btn-outline" style={{ padding: '0.45rem' }} title="Edit Chapter"><FiEdit2 size={13} /></button>
                            <button type="button" onClick={() => handleDelete(chapter)} disabled={deletingId === chId} className="btn btn-sm btn-danger" style={{ padding: '0.45rem' }} title="Delete Chapter"><FiTrash2 size={13} /></button>
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
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} closeDisabled={submitting} title={editingId ? 'Edit Chapter' : 'Add Chapter'} size="lg">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Chapter Title</label>
            <input type="text" className="form-input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Video URL (YouTube Watch or Embed URL)</label>
            <input type="text" className="form-input" value={formData.videoUrl} onChange={e => setFormData({...formData, videoUrl: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Content (Text/HTML)</label>
            <textarea className="form-textarea" rows="6" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmText={confirmState?.confirmText}
        confirmVariant="danger"
        loading={Boolean(deletingId)}
        onConfirm={confirmState?.onConfirm}
        onCancel={() => !deletingId && setConfirmState(null)}
      />
    </div>
  );
};

export default ManageChapters;
