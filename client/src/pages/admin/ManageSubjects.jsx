import React, { useState, useEffect } from 'react';
import { getAllCourses } from '../../api/courseApi';
import { getSubjectsByCourse, createSubject, updateSubject, deleteSubject } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageSubjects = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', courseId: '' });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const res = await getAllCourses();
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
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await deleteSubject(id);
        toast.success('Subject deleted');
        fetchSubjects(selectedCourse);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error deleting subject');
      }
    }
  };

  if (loading && courses.length === 0) return <Loader fullPage />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Manage Subjects</h1>
      </div>

      <div className="card-glass" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div className="form-group" style={{ maxWidth: '450px', margin: 0 }}>
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
        <div className="card-glass" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem' }}>Subjects for selected course</h2>
            <button onClick={() => openModal()} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiPlus /> Add Subject
            </button>
          </div>

          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Name</th>
                  <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Description</th>
                  <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No subjects found for this course. Click &ldquo;Add Subject&rdquo; to create one.</td></tr>
                ) : (
                  subjects.map(subject => {
                    const sId = subject.id || subject._id;
                    return (
                      <tr key={sId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem 0', fontWeight: 600 }}>{subject.name || subject.title}</td>
                        <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{subject.description ? `${subject.description.substring(0, 60)}...` : '—'}</td>
                        <td style={{ padding: '1rem 0', display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => openModal(subject)} className="btn btn-sm btn-outline" style={{ padding: '0.5rem' }} title="Edit Subject"><FiEdit2 /></button>
                          <button onClick={() => handleDelete(sId)} className="btn btn-sm btn-danger" style={{ padding: '0.5rem' }} title="Delete Subject"><FiTrash2 /></button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Subject Name</label>
            <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageSubjects;
