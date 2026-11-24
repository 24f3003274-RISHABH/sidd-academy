import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCourses } from '../../api/courseApi';
import { getSubjectsByCourse, createSubject, updateSubject, deleteSubject } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { FiEdit2, FiTrash2, FiPlus, FiFolder } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageSubjects = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', courseId: '' });

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
      fetchSubjects(selectedCourse);
    } else {
      setSubjects([]);
    }
  }, [selectedCourse]);

  const fetchSubjects = async (courseId) => {
    setLoading(true);
    try {
      const res = await getSubjectsByCourse(courseId);
      const list = res.data?.data?.subjects || res.data?.subjects || (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
      setSubjects(list);
    } catch (err) {
      toast.error('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (subject = null) => {
    if (!selectedCourse) {
      toast.error('Please select a course first');
      return;
    }
    if (subject) {
      setEditingId(subject.id || subject._id);
      setFormData({
        name: subject.name || subject.title || '',
        description: subject.description || '',
        courseId: selectedCourse,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        courseId: selectedCourse,
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
        await updateSubject(editingId, formData);
        toast.success('Subject updated');
      } else {
        await createSubject(formData);
        toast.success('Subject created');
      }
      setIsModalOpen(false);
      fetchSubjects(selectedCourse);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (subject) => {
    const id = subject.id || subject._id;
    if (deletingId) return;
    setConfirmState({
      title: 'Delete Subject?',
      message: `Permanently delete "${subject.name || subject.title}" and its nested chapters?`,
      confirmText: 'Delete Subject',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await deleteSubject(id);
          toast.success('Subject deleted');
          fetchSubjects(selectedCourse);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Error deleting subject');
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
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Manage Subjects</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Organize course subjects or jump into Course Studio to manage subjects, chapters, videos, and PDFs together.
          </p>
        </div>
        <Link to={selectedCourse ? `/admin/curriculum?courseId=${selectedCourse}` : '/admin/curriculum'} className="btn btn-outline btn-sm">
          <FiFolder size={14} /> Open in Course Studio
        </Link>
      </div>

      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ maxWidth: '460px', margin: 0 }}>
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
      </div>

      {selectedCourse && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Subjects ({subjects.length})</h2>
            <button type="button" onClick={() => openModal()} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiPlus /> Add Subject
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No subjects found for this course. Click &ldquo;Add Subject&rdquo; to create one.</td></tr>
                ) : (
                  subjects.map(subject => {
                    const sId = subject.id || subject._id;
                    return (
                      <tr key={sId}>
                        <td style={{ fontWeight: 600 }}>{subject.name || subject.title}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{subject.description ? (subject.description.length > 80 ? `${subject.description.substring(0, 80)}…` : subject.description) : '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button type="button" onClick={() => openModal(subject)} className="btn btn-sm btn-outline" style={{ padding: '0.45rem' }} title="Edit Subject"><FiEdit2 size={13} /></button>
                            <button type="button" onClick={() => handleDelete(subject)} disabled={deletingId === sId} className="btn btn-sm btn-danger" style={{ padding: '0.45rem' }} title="Delete Subject"><FiTrash2 size={13} /></button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} closeDisabled={submitting} title={editingId ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Subject Name</label>
            <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
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

export default ManageSubjects;
