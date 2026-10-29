import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCourses, createCourse, updateCourse, deleteCourse } from '../../api/courseApi';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiEdit2, FiTrash2, FiPlus, FiLayers } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatPrice, getEffectivePrice } from '../../utils/helpers';

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', description: '', price: 0, isFree: false,
    level: 'Beginner', duration: '', instructor: '', thumbnail: ''
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await getAllCourses();
      const list = res.data?.data?.courses || res.data?.courses || (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
      setCourses(list);
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
      setEditingId(course.id || course._id);
      setThumbnailFile(null);
      setFormData({
        title: course.title || '',
        description: course.description || '',
        price: course.price || 0,
        isFree: Boolean(course.isFree),
        level: course.level || 'Beginner',
        duration: course.duration || '',
        instructor: course.instructor || '',
        thumbnail: course.thumbnail || '',
      });
    } else {
      setEditingId(null);
      setThumbnailFile(null);
      setFormData({
        title: '',
        description: '',
        price: 0,
        isFree: false,
        level: 'Beginner',
        duration: '',
        instructor: '',
        thumbnail: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value ?? ''));
      if (thumbnailFile) payload.append('thumbnail', thumbnailFile);
      if (editingId) {
        await updateCourse(editingId, payload);
        toast.success('Course updated');
      } else {
        await createCourse(payload);
        toast.success('Course created');
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (deletingId) return;
    if (window.confirm('Are you sure you want to delete this course?')) {
      setDeletingId(id);
      try {
        await deleteCourse(id);
        toast.success('Course deleted');
        fetchCourses();
      } catch (err) {
        toast.error('Error deleting course');
      } finally {
        setDeletingId(null);
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
              {courses.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No courses found in database. Click &ldquo;Add Course&rdquo; above to create one.
                  </td>
                </tr>
              ) : (
                courses.map(course => {
                  const cId = course.id || course._id;
                  return (
                    <tr key={cId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem 0', fontWeight: 600 }}>{course.title}</td>
                      <td style={{ padding: '1rem 0' }}>{course.instructor || 'Faculty'}</td>
                      <td style={{ padding: '1rem 0' }}><span className="badge badge-primary">{course.level || 'All Levels'}</span></td>
                      <td style={{ padding: '1rem 0' }}>{formatPrice(getEffectivePrice(course))}</td>
                      <td style={{ padding: '1rem 0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <Link to={`/admin/curriculum?courseId=${cId}`} className="btn btn-sm btn-primary" style={{ padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }} title="Manage Syllabus & Lessons">
                          <FiLayers /> Curriculum
                        </Link>
                        <button onClick={() => openModal(course)} className="btn btn-sm btn-outline" style={{ padding: '0.45rem' }} title="Edit Course"><FiEdit2 /></button>
                        <button onClick={() => handleDelete(cId)} disabled={deletingId === cId} className="btn btn-sm btn-danger" style={{ padding: '0.45rem' }} title="Delete Course"><FiTrash2 /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} closeDisabled={submitting} title={editingId ? 'Edit Course' : 'Add Course'} size="lg">
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
              <input type="number" min="0" step="0.01" inputMode="decimal" className="form-input" disabled={formData.isFree} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value === '' ? '' : Number(e.target.value)})} />
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
              <label className="form-label">Course thumbnail</label>
              <input type="file" className="form-input" accept="image/jpeg,image/png,image/webp" onChange={e => setThumbnailFile(e.target.files?.[0] || null)} />
              <small style={{ color: 'var(--text-muted)' }}>{thumbnailFile ? thumbnailFile.name : editingId && formData.thumbnail ? 'Current thumbnail will be kept unless replaced.' : 'JPG, PNG, or WebP up to 5 MB.'}</small>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Course'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageCourses;
