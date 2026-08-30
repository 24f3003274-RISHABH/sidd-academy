import React, { useState, useEffect } from 'react';
import { getAllVideos, createVideo, updateVideo, deleteVideo } from '../../api/videoApi';
import { getAllCourses } from '../../api/courseApi';
import { getSubjectsByCourse, getChaptersBySubject } from '../../api/adminApi';
import axiosInstance from '../../api/axiosInstance';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import VideoPlayerEmbed from '../../components/video/VideoPlayerEmbed';
import { FiVideo, FiYoutube, FiPlus, FiTrash2, FiEdit2, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Cascading hierarchy dropdowns
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');

  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState('');

  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    playlistUrl: '',
    videoProvider: 'youtube',
    durationSeconds: 1800,
    quality: '1080p',
    order: 1,
    isFree: false,
    isPublished: true,
  });

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await getAllVideos();
      setVideos(res.data?.data?.videos || res.data?.videos || []);
    } catch (err) {
      toast.error('Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await getAllCourses();
      const list = res.data?.data?.courses || res.data?.courses || [];
      setCourses(list);
    } catch (err) {
      console.warn('Failed to load courses:', err);
    }
  };

  useEffect(() => {
    fetchVideos();
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
        const list = res.data?.data?.subjects || res.data?.subjects || [];
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
        const list = res.data?.data?.chapters || res.data?.chapters || [];
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
        const res = await axiosInstance.get(`/lessons?chapterId=${selectedChapter}`);
        const list = res.data?.data?.lessons || res.data?.data?.classes || res.data?.lessons || [];
        setLessons(list);
      } catch (err) {
        console.warn('Failed to load lessons:', err);
      }
    };
    fetchLess();
  }, [selectedChapter]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      playlistUrl: '',
      videoProvider: 'youtube',
      durationSeconds: 1800,
      quality: '1080p',
      order: 1,
      isFree: false,
      isPublished: true,
    });
    setSelectedCourse('');
    setSelectedSubject('');
    setSelectedChapter('');
    setSelectedLesson('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (video) => {
    setEditingId(video.id || video._id);
    setFormData({
      title: video.title || '',
      description: video.description || '',
      videoUrl: video.videoUrl || '',
      playlistUrl: video.playlistUrl || '',
      videoProvider: video.videoProvider || 'youtube',
      durationSeconds: video.durationSeconds || 1800,
      quality: video.quality || '1080p',
      order: video.order || 1,
      isFree: Boolean(video.isFree),
      isPublished: video.isPublished !== undefined ? Boolean(video.isPublished) : true,
    });
    setSelectedCourse(video.courseId || '');
    setSelectedSubject(video.subjectId || '');
    setSelectedChapter(video.chapterId || '');
    setSelectedLesson(video.lessonId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Video title is required');
      return;
    }
    if (!formData.videoUrl && !formData.playlistUrl) {
      toast.error('Please provide a YouTube video URL or playlist URL');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        courseId: selectedCourse || null,
        subjectId: selectedSubject || null,
        chapterId: selectedChapter || null,
        lessonId: selectedLesson || null,
      };

      if (editingId) {
        await updateVideo(editingId, payload);
        toast.success('Video updated successfully');
      } else {
        await createVideo(payload);
        toast.success('Video created successfully');
      }

      setIsModalOpen(false);
      fetchVideos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save video');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteVideo(id);
        toast.success('Video deleted successfully');
        fetchVideos();
      } catch (err) {
        toast.error('Failed to delete video');
      }
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Manage YouTube Videos</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
            Add, edit, and link YouTube lectures to Courses, Subjects, and Chapters.
          </p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiPlus /> Add Video Stream
        </button>
      </div>

      {/* Videos List Table */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Thumbnail</th>
                <th>Video Title</th>
                <th>Hierarchy / Link</th>
                <th>Provider</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                    <FiVideo size={36} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                    <p>No video streams added yet. Click "Add Video Stream" to begin.</p>
                  </td>
                </tr>
              ) : (
                videos.map((vid) => {
                  const id = vid.id || vid._id;
                  return (
                    <tr key={id}>
                      <td>
                        <img
                          src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=80'}
                          alt={vid.title}
                          style={{ width: '80px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border)' }}
                        />
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{vid.title}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                          <FiYoutube style={{ color: '#dc2626' }} />
                          <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {vid.videoUrl || vid.playlistUrl}
                          </span>
                        </div>
                      </td>
                      <td>
                        {vid.lessonTitle ? (
                          <span className="badge badge-primary">{vid.lessonTitle}</span>
                        ) : vid.courseTitle ? (
                          <span className="badge badge-secondary">{vid.courseTitle}</span>
                        ) : (
                          <span className="badge badge-outline">General / Stream</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-outline" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          {vid.videoProvider}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${vid.isFree ? 'badge-success' : 'badge-primary'}`}>
                          {vid.isFree ? 'Free Preview' : 'Pro'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenEditModal(vid)}
                            className="btn btn-sm btn-outline"
                            title="Edit Video"
                          >
                            <FiEdit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(id)}
                            className="btn btn-sm btn-danger"
                            title="Delete Video"
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

      {/* Add / Edit Video Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Update Video Stream' : 'Add YouTube Video Stream'}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Video Title *</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Chapter 1: Chemical Kinetics - Lecture 01"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-input"
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief topic breakdown or key formula summary..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">YouTube Video URL</label>
            <input
              type="url"
              className="form-input"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">YouTube Playlist URL (Optional)</label>
            <input
              type="url"
              className="form-input"
              value={formData.playlistUrl}
              onChange={(e) => setFormData({ ...formData, playlistUrl: e.target.value })}
              placeholder="https://www.youtube.com/playlist?list=..."
            />
          </div>

          {/* Live Preview Embed */}
          {(formData.videoUrl || formData.playlistUrl) && (
            <div style={{ backgroundColor: '#0f172a', padding: '0.875rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Live Stream Preview:
              </span>
              <VideoPlayerEmbed
                videoUrl={formData.videoUrl}
                playlistUrl={formData.playlistUrl}
                title={formData.title || 'Preview'}
              />
            </div>
          )}

          {/* Hierarchy Association */}
          <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: 'var(--primary-dark)', fontWeight: 700 }}>
              Hierarchy Association (Optional)
            </h4>

            <div className="grid-2" style={{ gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Course</label>
                <select
                  className="form-input"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">-- Select Course --</option>
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
                    <option key={s._id || s.id} value={s._id || s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '0.75rem', marginTop: '0.5rem' }}>
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

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Lesson</label>
                <select
                  className="form-input"
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  disabled={!selectedChapter}
                >
                  <option value="">-- Select Lesson --</option>
                  {lessons.map((l) => (
                    <option key={l._id || l.id} value={l._id || l.id}>{l.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={formData.isFree}
                onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
              />
              Free Lecture (No Login / Free Preview)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              />
              Published (Visible to students)
            </label>
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
              {submitting ? 'Saving...' : editingId ? 'Update Video' : 'Save Video Stream'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageVideos;
