import React, { useState, useEffect } from 'react';
import { getAllCourses } from '../../api/courseApi';
import { getSubjectsByCourse, getChaptersBySubject, createClass, updateClass, deleteClass } from '../../api/adminApi';
import axiosInstance from '../../api/axiosInstance';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiEdit2, FiTrash2, FiPlus, FiVideo, FiYoutube, FiFileText, FiClock, FiCheck, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageClasses = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: '30:00',
    isFree: true,
    isProtected: false,
    notesUrl: '',
    order: 1,
    chapter: '',
  });

  // Fetch all courses on mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await getAllCourses();
        const list = res.data?.data?.courses || res.data?.courses || [];
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourse(list[0]._id);
        }
      } catch (err) {
        toast.error('Failed to fetch courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch subjects when course changes
  useEffect(() => {
    if (selectedCourse) {
      getSubjectsByCourse(selectedCourse)
        .then(res => {
          const list = res.data?.data?.subjects || res.data?.subjects || [];
          setSubjects(list);
          if (list.length > 0) {
            setSelectedSubject(list[0]._id);
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

  // Fetch chapters when subject changes
  useEffect(() => {
    if (selectedSubject) {
      getChaptersBySubject(selectedSubject)
        .then(res => {
          const list = res.data?.data?.chapters || res.data?.chapters || [];
          setChapters(list);
          if (list.length > 0) {
            setSelectedChapter(list[0]._id);
          } else {
            setSelectedChapter('');
          }
        })
        .catch(() => {
          setChapters([]);
          setSelectedChapter('');
        });
    } else {
      setChapters([]);
      setSelectedChapter('');
    }
  }, [selectedSubject]);

  // Fetch classes when chapter changes
  const fetchClasses = async (chapterId) => {
    if (!chapterId) {
      setClasses([]);
      return;
    }
    setClassesLoading(true);
    try {
      const res = await axiosInstance.get(`/classes/chapter/${chapterId}`);
      const list = res.data?.data?.classes || res.data?.classes || [];
      setClasses(list);
    } catch (err) {
      console.error('Error fetching classes', err);
      toast.error('Failed to fetch video classes');
    } finally {
      setClassesLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChapter) {
      fetchClasses(selectedChapter);
    } else {
      setClasses([]);
    }
  }, [selectedChapter]);

  const openModal = (cls = null) => {
    if (!selectedChapter) {
      toast.error('Please select Course, Subject and Chapter first');
      return;
    }
    if (cls) {
      setEditingId(cls._id);
      setFormData({
        title: cls.title || '',
        description: cls.description || '',
        videoUrl: cls.videoUrl || '',
        duration: cls.duration || '30:00',
        isFree: cls.isFree !== undefined ? cls.isFree : true,
        isProtected: cls.isProtected !== undefined ? cls.isProtected : false,
        notesUrl: cls.notesUrl || '',
        order: cls.order || 1,
        chapter: selectedChapter,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: '30:00',
        isFree: true,
        isProtected: false,
        notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        order: classes.length + 1,
        chapter: selectedChapter,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedChapter) {
      toast.error('Please select a chapter');
      return;
    }
    try {
      const payload = { ...formData, chapter: selectedChapter };
      if (editingId) {
        await updateClass(editingId, payload);
        toast.success('Video lecture updated');
      } else {
        await createClass(payload);
        toast.success('New video lecture added to chapter');
      }
      setIsModalOpen(false);
      fetchClasses(selectedChapter);
    } catch (err) {
      toast.error('Error saving video lecture');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this video lecture?')) {
      try {
        await deleteClass(id);
        toast.success('Video lecture removed');
        fetchClasses(selectedChapter);
      } catch (err) {
        toast.error('Error deleting video lecture');
      }
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Manage Video Lectures & Classes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Add YouTube video lectures, set durations, attach chapter PDFs, and manage free previews.
          </p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="btn btn-primary"
          disabled={!selectedChapter}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FiPlus /> Add New Video Lecture
        </button>
      </div>

      {/* Hierarchical Selector: Course -> Subject -> Chapter */}
      <div className="card-glass" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '12px' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Select Course & Curriculum Chapter
        </div>
        <div className="grid-3">
          <div className="form-group">
            <label className="form-label">1. Select Course</label>
            <select 
              className="form-input" 
              value={selectedCourse} 
              onChange={e => setSelectedCourse(e.target.value)}
            >
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">2. Select Subject</label>
            <select 
              className="form-input" 
              value={selectedSubject} 
              onChange={e => setSelectedSubject(e.target.value)}
              disabled={subjects.length === 0}
            >
              {subjects.length === 0 && <option value="">No subjects found in course</option>}
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">3. Select Chapter</label>
            <select 
              className="form-input" 
              value={selectedChapter} 
              onChange={e => setSelectedChapter(e.target.value)}
              disabled={chapters.length === 0}
            >
              {chapters.length === 0 && <option value="">No chapters found in subject</option>}
              {chapters.map(ch => (
                <option key={ch._id} value={ch._id}>{ch.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Video Lectures List */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            Video Lectures in this Chapter ({classes.length})
          </h2>
          {selectedChapter && (
            <button onClick={() => openModal()} className="btn btn-sm btn-outline">
              <FiPlus /> Add Lecture
            </button>
          )}
        </div>

        {classesLoading ? (
          <div style={{ padding: '3rem 0', textAlign: 'center' }}>
            <Loader />
          </div>
        ) : classes.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
            <FiVideo size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <p style={{ marginBottom: '1rem' }}>No video lectures added to this chapter yet.</p>
            {selectedChapter ? (
              <button onClick={() => openModal()} className="btn btn-primary btn-sm">
                Add First Video Lecture
              </button>
            ) : (
              <p style={{ fontSize: '0.85rem' }}>Please select Course & Chapter above.</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {classes.map((cls, idx) => (
              <div 
                key={cls._id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '1.25rem', 
                  backgroundColor: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.06)', 
                  borderRadius: '12px',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
                  <div 
                    style={{ 
                      width: '44px', 
                      height: '44px', 
                      borderRadius: '8px', 
                      backgroundColor: 'rgba(255,0,0,0.1)', 
                      color: '#ff4d4d', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      flexShrink: 0
                    }}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{cls.title}</span>
                      <span className={`badge ${cls.isFree ? 'badge-success' : 'badge-paid'}`}>
                        {cls.isFree ? 'Free Preview' : 'Members Only'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FiClock /> {cls.duration || '30 mins'}
                      </span>
                      {cls.notesUrl && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)' }}>
                          <FiFileText /> Notes Attached
                        </span>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#ff4d4d' }}>
                        <FiYoutube /> YouTube Embed
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {cls.videoUrl && (
                    <a 
                      href={cls.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-sm btn-outline"
                      title="Watch on YouTube"
                    >
                      <FiExternalLink /> Watch
                    </a>
                  )}
                  <button 
                    onClick={() => openModal(cls)} 
                    className="btn btn-sm btn-outline"
                    title="Edit lecture details"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(cls._id)} 
                    className="btn btn-sm btn-danger"
                    title="Delete lecture"
                  >
                    <FiTrash2 /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Lecture Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? 'Edit Video Lecture' : 'Add Video Lecture to Chapter'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Lecture Title (e.g. LEC 06 chemical kinetics...)</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
              placeholder="e.g. LEC 06 chemical kinetics FACTOR AFFECTING RATE OF RXN"
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">YouTube Video URL / Link</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={formData.videoUrl} 
                onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} 
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (e.g. 33:32 or 45 mins)</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={formData.duration} 
                onChange={e => setFormData({ ...formData, duration: e.target.value })} 
                placeholder="e.g. 33:32"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Lecture Description / Key Topics</label>
            <textarea 
              className="form-textarea" 
              rows="3" 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Brief summary of concepts covered in this video lecture"
            ></textarea>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Attached PDF Notes URL (Optional)</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.notesUrl} 
                onChange={e => setFormData({ ...formData, notesUrl: e.target.value })} 
                placeholder="https://.../notes.pdf"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lecture Sequence / Order</label>
              <input 
                type="number" 
                className="form-input" 
                value={formData.order} 
                onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.isFree} 
                onChange={e => setFormData({ ...formData, isFree: e.target.checked })} 
                style={{ width: '18px', height: '18px' }} 
              />
              <span style={{ fontWeight: 600 }}>Free Preview for all students</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Save Changes' : 'Add Video Lecture'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageClasses;
