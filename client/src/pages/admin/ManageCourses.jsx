import React, { useState, useEffect } from 'react';
import { getAllCourses, createCourse, updateCourse, deleteCourse } from '../../api/courseApi';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/helpers';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', description: '', price: 0, isFree: false,
    level: 'Beginner', duration: '', instructor: '', thumbnail: ''
  });

  const fetchCourses = async () => {
    try {
      const res = await getAllCourses();
      setCourses(res.data.courses || []);
    } catch (err) {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openModal = (course = null) => {
    if (course) {
      setEditingId(course._id);
      setFormData({
        title: course.title, description: course.description, price: course.price,
        isFree: course.isFree, level: course.level, duration: course.duration,
        instructor: course.instructor, thumbnail: course.thumbnail
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '', description: '', price: 0, isFree: false,
        level: 'Beginner', duration: '', instructor: '', thumbnail: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateCourse(editingId, formData);
        toast.success('Course updated');
      } else {
        await createCourse(formData);
        toast.success('Course created');
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving course');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteCourse(id);
        toast.success('Course deleted');
        fetchCourses();
      } catch (err) {
        toast.error('Error deleting course');
      }
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Manage Courses</h1>
        <button onClick={() => openModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiPlus /> Add Course
        </button>
      </div>

      <div className="card-glass" style={{ padding: '1.5rem' }}>
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Title</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Instructor</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Level</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Price</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0' }}>{course.title}</td>
                  <td style={{ padding: '1rem 0' }}>{course.instructor}</td>
                  <td style={{ padding: '1rem 0' }}><span className="badge badge-primary">{course.level}</span></td>
                  <td style={{ padding: '1rem 0' }}>{course.isFree ? 'Free' : formatPrice(course.price)}</td>
                  <td style={{ padding: '1rem 0', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openModal(course)} className="btn btn-sm btn-outline" style={{ padding: '0.5rem' }}><FiEdit2 /></button>
                    <button onClick={() => handleDelete(course._id)} className="btn btn-sm btn-danger" style={{ padding: '0.5rem' }}><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Course' : 'Add Course'} size="lg">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input type="text" className="form-input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Instructor</label>
              <input type="text" className="form-input" required value={formData.instructor} onChange={e => setFormData({...formData, instructor: e.target.value})} />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows="4" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Level</label>
              <select className="form-select" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price</label>
              <input type="number" className="form-input" disabled={formData.isFree} value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.isFree} onChange={e => setFormData({...formData, isFree: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                <span>Is Free Course</span>
              </label>
            </div>
          </div>
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Duration</label>
              <input type="text" className="form-input" placeholder="e.g. 10 Hours" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">Thumbnail URL</label>
              <input type="text" className="form-input" placeholder="https://..." value={formData.thumbnail} onChange={e => setFormData({...formData, thumbnail: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Course</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageCourses;
