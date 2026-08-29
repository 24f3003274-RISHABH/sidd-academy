import React, { useState, useEffect } from 'react';
import { getAllVideos, createVideo, updateVideo, deleteVideo } from '../../api/videoApi';
import { getAllCourses } from '../../api/courseApi';
import { getSubjectsByCourse, getChaptersBySubject } from '../../api/adminApi';
import axiosInstance from '../../api/axiosInstance';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import VideoPlayerEmbed from '../../components/video/VideoPlayerEmbed';
import { FiVideo, FiYoutube, FiPlus, FiTrash2, FiEdit2, FiExternalLink, FiPlay, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Cascading hierarchy dropdowns for associating video with lesson
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
    videoUrl: '',
    playlistUrl: '',
    videoProvider: 'youtube',
    durationSeconds: 1800,
    quality: '1080p',
    order: 1,
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
        if (list.length > 0) setSelectedSubject(list[0]._id || list[0].id);
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
        if (list.length > 0) setSelectedChapter(list[0]._id || list[0].id);
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
        if (list.length > 0) setSelectedLesson(list[0]._id || list[0].id);
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
      videoUrl: '',
      playlistUrl: '',
      videoProvider: 'youtube',
      durationSeconds: 1800,
      quality: '1080p',
      order: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (video) => {
    setEditingId(video.id || video._id);
    setFormData({
      title: video.title || '',
      videoUrl: video.videoUrl || '',
      playlistUrl: video.playlistUrl || '',
      videoProvider: video.videoProvider || 'youtube',
      durationSeconds: video.durationSeconds || 1800,
      quality: video.quality || '1080p',
      order: video.order || 1,
    });
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
        lessonId: selectedLesson || null,
      };

      if (editingId) {
        await updateVideo(editingId, payload);
        toast.success('Video updated successfully');
      } else {
        await createVideo(payload);
        toast.success('Video created and linked to lesson successfully');
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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Manage YouTube Videos</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
            Add, update, and associate YouTube video streams & playlists with course lessons.
          </p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiPlus /> Add Video Stream
        </button>
      </div>

      {/* Videos List Table */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '12px' }}>
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Thumbnail</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Video Title</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Associated Lesson</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Provider</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Quality</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <FiVideo size={36} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>No video streams linked yet. Click "Add Video Stream" to begin.</p>
                  </td>
                </tr>
              ) : (
                videos.map((vid) => (
                  <tr key={vid.id || vid._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <img
                        src={vid.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=80'}
                        alt={vid.title}
                        style={{ width: '80px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{vid.title}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <FiYoutube style={{ color: '#ff0000' }} />
                        <span style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {vid.videoUrl || vid.playlistUrl}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {vid.lessonTitle ? (
                        <span className="badge badge-primary">{vid.lessonTitle}</span>
                      ) : (
                        <span style={{ opacity: 0.5 }}>Unassigned</span>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className="badge badge-outline" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        {vid.videoProvider}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#43e97b' }}>
                      {vid.quality}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenEditModal(vid)}
                          className="btn btn-sm btn-outline"
                          style={{ padding: '0.4rem 0.6rem' }}
                          title="Edit Video"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(vid.id || vid._id)}
                          className="btn btn-sm btn-danger"
                          style={{ padding: '0.4rem 0.6rem' }}
                          title="Delete Video"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
            <label className="form-label">Video Title</label>
            <input
              type="text"
              className="form-input"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Chapter 1: Chemical Reactions & Equations - Lecture 01"
            />
          </div>

          <div className="form-group">
            <label className="form-label">YouTube Video URL</label>
            <input
              type="url"
              className="form-input"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/..."
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              Standard video, YouTube Shorts, or embed link. Large videos are streamed directly via YouTube.
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">YouTube Playlist URL (Optional)</label>
            <input
              type="url"
              className="form-input"
              value={formData.playlistUrl}
              onChange={(e) => setFormData({ ...formData, playlistUrl: e.target.value })}
              placeholder="https://www.youtube.com/playlist?list=PLxyz..."
            />
          </div>

          {/* Live Preview Embed */}
          {(formData.videoUrl || formData.playlistUrl) && (
            <div style={{ backgroundColor: '#121420', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Live Stream Preview:
              </span>
              <VideoPlayerEmbed
                videoUrl={formData.videoUrl}
                playlistUrl={formData.playlistUrl}
                title={formData.title || 'Preview'}
              />
            </div>
          )}

          {/* Lesson Association Cascade */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--primary)' }}>
              Associate with Lesson (Course &rarr; Subject &rarr; Chapter &rarr; Lesson)
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
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Lesson / Class</label>
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

          <div className="grid-3" style={{ gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Provider</label>
              <select
                className="form-input"
                value={formData.videoProvider}
                onChange={(e) => setFormData({ ...formData, videoProvider: e.target.value })}
              >
                <option value="youtube">YouTube Embed</option>
                <option value="vimeo">Vimeo</option>
                <option value="custom">Custom Provider</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quality</label>
              <select
                className="form-input"
                value={formData.quality}
                onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
              >
                <option value="1080p">1080p Full HD</option>
                <option value="720p">720p HD</option>
                <option value="4K">4K Ultra HD</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Order</label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
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
