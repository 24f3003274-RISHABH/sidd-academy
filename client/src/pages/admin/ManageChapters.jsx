import React, { useState, useEffect } from 'react';
import { getAllCourses } from '../../api/courseApi';
import { getSubjectsByCourse, getChaptersBySubject, createChapter, updateChapter, deleteChapter } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageChapters = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', videoUrl: '', subjectId: '' });

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
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this chapter?')) {
      try {
        await deleteChapter(id);
        toast.success('Chapter deleted');
        fetchChapters(selectedSubject);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error deleting chapter');
      }
    }
  };

  if (loading && courses.length === 0) return <Loader fullPage />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Manage Chapters</h1>
      </div>

      <div className="card-glass grid-2" style={{ padding: '1.5rem', marginBottom: '2rem', gap: '2rem' }}>
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
        <div className="card-glass" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem' }}>Chapters</h2>
            <button onClick={() => openModal()} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiPlus /> Add Chapter
            </button>
          </div>

          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Title</th>
                  <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Video URL</th>
                  <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {chapters.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No chapters found for this subject. Click &ldquo;Add Chapter&rdquo; to create one.</td></tr>
                ) : (
                  chapters.map(chapter => {
                    const chId = chapter.id || chapter._id;
                    return (
                      <tr key={chId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '1rem 0', fontWeight: 600 }}>{chapter.title}</td>
                        <td style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>{chapter.videoUrl ? 'Yes' : 'No'}</td>
                        <td style={{ padding: '1rem 0', display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => openModal(chapter)} className="btn btn-sm btn-outline" style={{ padding: '0.5rem' }} title="Edit Chapter"><FiEdit2 /></button>
                          <button onClick={() => handleDelete(chId)} className="btn btn-sm btn-danger" style={{ padding: '0.5rem' }} title="Delete Chapter"><FiTrash2 /></button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Chapter' : 'Add Chapter'} size="lg">
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageChapters;
