import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  previewPlaylist,
  importPlaylist,
  getSubjectsByCourse,
  getChaptersBySubject,
} from '../../api/courseApi';
import { getAllNotes, createNote, deleteNote } from '../../api/noteApi';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiLayers,
  FiYoutube,
  FiFileText,
  FiCloud,
  FiCheckCircle,
  FiExternalLink,
  FiArrowUp,
  FiArrowDown,
  FiPlay,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { formatPrice, getEffectivePrice, getNoteDriveViewUrl } from '../../utils/helpers';

const OFFICIAL_CHANNEL_PLAYLISTS = [
  { id: 'PLKsilHHi-1ZQ', title: 'Class 12 Chemistry — CHEMICAL KINETICS (रासायनिक बलगतिकी)', level: 'Class 12', subject: 'Class 12 Chemistry' },
  { id: 'PL4DQCiK7p4ZWD80a41vqlZT71zXdas7Pl', title: 'Class 12 Chemistry — SOLUTION (विलयन)', level: 'Class 12', subject: 'Class 12 Chemistry' },
  { id: 'PL4DQCiK7p4ZU2pstQafHazLxW32KZUdNU', title: 'Class 12 Chemistry — ELECTROCHEMISTRY (वैद्युत रसायन)', level: 'Class 12', subject: 'Class 12 Chemistry' },
  { id: 'PL4DQCiK7p4ZWWIfRWknHd8zYxGdOCyvip', title: 'Class 12 Physics — Electrostatic (स्थिरवैद्युतिकी)', level: 'Class 12', subject: 'Class 12 Physics' },
  { id: 'PLF7wljYwTV-w', title: 'Class 12 Organic Chemistry — Alcohol, Phenol & Ether', level: 'Class 12', subject: 'Organic Chemistry' },
  { id: 'PLAx_BGsVQuKc', title: 'Class 12 Chemistry / Biology — BIOMOLECULES (जैव-अणु)', level: 'Class 12', subject: 'Biomolecules' },
  { id: 'PLRntVCXiEo8E', title: 'Class 12 Biology — पुष्पी पादपो में लैंगिक जनन', level: 'Class 12', subject: 'Class 12 Biology' },
  { id: 'PLMAR6dVeMATU', title: 'Class 10 & 12 Physics — Electric Current 💡⚡ (वैद्युत धारा)', level: 'Class 12', subject: 'Physics' },
  { id: 'PLLN2WU1NsA2o', title: 'Class 12 Physics — RAY OPTICS (किरण प्रकाशिकी)', level: 'Class 12', subject: 'Class 12 Physics' },
  { id: 'PLFBdKX91EvMA', title: 'Foundation & Class 10-12 — BASIC MATHEMATICS', level: 'Class 10', subject: 'Mathematics' },
];

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  // YouTube Playlist Importer Modal State
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [targetExistingCourse, setTargetExistingCourse] = useState(null);
  const [playlistInput, setPlaylistInput] = useState('');
  const [fetchingPlaylist, setFetchingPlaylist] = useState(false);
  const [importingPlaylist, setImportingPlaylist] = useState(false);
  const [playlistPreviewData, setPlaylistPreviewData] = useState(null);
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [playlistCourseForm, setPlaylistCourseForm] = useState({
    title: '',
    description: '',
    instructor: 'Siddhant Pandey & आकाश सर',
    level: 'Class 12',
    price: 499,
    isFree: false,
    subjectTitle: '',
    chapterTitle: '',
    freePreviewCount: 2,
  });

  // Course / Chapter Study Notes Upload Modal State
  const [notesModalCourse, setNotesModalCourse] = useState(null);
  const [courseSubjects, setCourseSubjects] = useState([]);
  const [courseChapters, setCourseChapters] = useState([]);
  const [courseNotesList, setCourseNotesList] = useState([]);
  const [noteScope, setNoteScope] = useState('course'); // 'course' | 'chapter'
  const [noteForm, setNoteForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    chapterId: '',
    isFree: true,
    price: 0,
  });
  const [noteFiles, setNoteFiles] = useState([]);
  const [uploadingNote, setUploadingNote] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    isFree: false,
    level: 'Class 12',
    duration: '',
    instructor: '',
    thumbnail: '',
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await getAllCourses({ limit: 100 });
      const list =
        res.data?.data?.courses ||
        res.data?.courses ||
        (Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
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
        level: course.level || 'Class 12',
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
        level: 'Class 12',
        duration: '',
        instructor: 'Siddhant Pandey & आकाश सर',
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

  // --- YouTube Playlist Importer Handlers ---
  const openPlaylistImporter = (existingCourse = null) => {
    setTargetExistingCourse(existingCourse);
    setPlaylistInput('');
    setPlaylistPreviewData(null);
    setPlaylistVideos([]);
    setPlaylistCourseForm({
      title: existingCourse ? existingCourse.title : '',
      description: existingCourse ? existingCourse.description : '',
      instructor: existingCourse?.instructor || 'Siddhant Pandey & आकाश सर',
      level: existingCourse?.level || 'Class 12',
      price: existingCourse ? existingCourse.price || 0 : 499,
      isFree: existingCourse ? Boolean(existingCourse.isFree) : false,
      subjectTitle: '',
      chapterTitle: '',
      freePreviewCount: 2,
    });
    setPlaylistModalOpen(true);
  };

  const handleFetchPlaylistPreview = async (overrideUrl = null, presetMeta = null) => {
    const urlToFetch = (overrideUrl !== null ? overrideUrl : playlistInput).trim();
    if (!urlToFetch) {
      toast.error('Please enter a YouTube Playlist URL or select a channel playlist');
      return;
    }
    setFetchingPlaylist(true);
    try {
      const res = await previewPlaylist({ playlistUrl: urlToFetch });
      const data = res.data?.data || res.data;
      setPlaylistPreviewData(data);
      setPlaylistVideos(data.videos || []);
      setPlaylistCourseForm((prev) => ({
        ...prev,
        title: targetExistingCourse
          ? targetExistingCourse.title
          : presetMeta?.title || data.title || prev.title || 'YouTube Playlist Course',
        description:
          data.description ||
          `Complete chapter-wise video lecture series for ${presetMeta?.title || data.title} in exact YouTube playlist order by SIDD ACADEMY PRAYAGRAJ (@Sidacademyprayagraj).`,
        level: presetMeta?.level || prev.level || 'Class 12',
        subjectTitle: presetMeta?.subject || data.title || 'Main Subject',
        chapterTitle: `Chapter: ${data.title || 'Video Lectures'}`,
      }));
      toast.success(`Fetched ${data.videos?.length || 0} videos in exact YouTube playlist order!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch YouTube playlist');
    } finally {
      setFetchingPlaylist(false);
    }
  };

  const movePlaylistVideo = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= playlistVideos.length) return;
    const copy = [...playlistVideos];
    const [moved] = copy.splice(index, 1);
    copy.splice(nextIndex, 0, moved);
    setPlaylistVideos(copy.map((v, idx) => ({ ...v, order: idx + 1 })));
  };

  const removePlaylistVideo = (index) => {
    const copy = playlistVideos.filter((_, idx) => idx !== index);
    setPlaylistVideos(copy.map((v, idx) => ({ ...v, order: idx + 1 })));
  };

  const toggleVideoFree = (index) => {
    setPlaylistVideos((prev) =>
      prev.map((v, idx) => (idx === index ? { ...v, isFree: !v.isFree } : v))
    );
  };

  const updateVideoTitle = (index, newTitle) => {
    setPlaylistVideos((prev) =>
      prev.map((v, idx) => (idx === index ? { ...v, title: newTitle } : v))
    );
  };

  const handleImportPlaylistSubmit = async (e) => {
    e.preventDefault();
    if (importingPlaylist) return;
    if (playlistVideos.length === 0 && !playlistInput.trim()) {
      toast.error('Please fetch or enter a YouTube playlist first');
      return;
    }
    setImportingPlaylist(true);
    try {
      const payload = {
        ...(targetExistingCourse ? { courseId: targetExistingCourse.id || targetExistingCourse._id } : {}),
        playlistUrl: playlistPreviewData?.playlistUrl || playlistInput.trim(),
        title: playlistCourseForm.title,
        description: playlistCourseForm.description,
        instructor: playlistCourseForm.instructor,
        level: playlistCourseForm.level,
        price: playlistCourseForm.isFree ? 0 : Number(playlistCourseForm.price) || 0,
        isFree: Boolean(playlistCourseForm.isFree),
        subjectTitle: playlistCourseForm.subjectTitle,
        chapterTitle: playlistCourseForm.chapterTitle,
        freePreviewCount: Number(playlistCourseForm.freePreviewCount) || 2,
        thumbnail: playlistPreviewData?.thumbnailUrl || playlistVideos[0]?.thumbnailUrl || '',
        videos: playlistVideos,
      };
      const res = await importPlaylist(payload);
      const importedCount = res.data?.data?.importedCount || playlistVideos.length;
      toast.success(
        targetExistingCourse
          ? `Added ${importedCount} playlist videos to "${targetExistingCourse.title}"!`
          : `Created new course with ${importedCount} videos arranged in playlist order!`
      );
      setPlaylistModalOpen(false);
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import YouTube playlist');
    } finally {
      setImportingPlaylist(false);
    }
  };

  // --- Course & Chapter Study Notes Upload Handlers ---
  const openCourseNotesModal = async (course) => {
    const courseId = course.id || course._id;
    setNotesModalCourse(course);
    setNoteScope('course');
    setNoteFiles([]);
    setNoteForm({
      title: '',
      description: '',
      subjectId: '',
      chapterId: '',
      isFree: Boolean(course.isFree) || Number(course.price || 0) <= 0,
      price: 0,
    });
    setCourseSubjects([]);
    setCourseChapters([]);
    setCourseNotesList([]);

    try {
      const [subjRes, notesRes] = await Promise.allSettled([
        getSubjectsByCourse(courseId),
        getAllNotes({ courseId, limit: 100 }),
      ]);
      if (subjRes.status === 'fulfilled') {
        const subjs = subjRes.value.data?.data?.subjects || subjRes.value.data?.subjects || [];
        setCourseSubjects(subjs);
        if (subjs[0]) {
          const firstSubjId = subjs[0].id || subjs[0]._id;
          setNoteForm((prev) => ({ ...prev, subjectId: firstSubjId }));
          const chapRes = await getChaptersBySubject(firstSubjId);
          const chaps = chapRes.data?.data?.chapters || chapRes.data?.chapters || [];
          setCourseChapters(chaps);
          if (chaps[0]) {
            setNoteForm((prev) => ({ ...prev, chapterId: chaps[0].id || chaps[0]._id }));
          }
        }
      }
      if (notesRes.status === 'fulfilled') {
        const nList = notesRes.value.data?.data?.notes || notesRes.value.data?.notes || [];
        setCourseNotesList(nList);
      }
    } catch (err) {
      console.error('Error loading course curriculum for notes:', err);
    }
  };

  const handleNoteSubjectChange = async (subjectId) => {
    setNoteForm((prev) => ({ ...prev, subjectId, chapterId: '' }));
    if (!subjectId) {
      setCourseChapters([]);
      return;
    }
    try {
      const chapRes = await getChaptersBySubject(subjectId);
      const chaps = chapRes.data?.data?.chapters || chapRes.data?.chapters || [];
      setCourseChapters(chaps);
      if (chaps[0]) {
        setNoteForm((prev) => ({ ...prev, chapterId: chaps[0].id || chaps[0]._id }));
      }
    } catch {
      setCourseChapters([]);
    }
  };

  const handleUploadCourseOrChapterNotes = async (e) => {
    e.preventDefault();
    if (!notesModalCourse || noteFiles.length === 0 || uploadingNote) {
      toast.error('Please select at least one PDF file to upload');
      return;
    }
    const courseId = notesModalCourse.id || notesModalCourse._id;
    setUploadingNote(true);
    try {
      let uploadedCount = 0;
      for (const file of noteFiles) {
        const fd = new FormData();
        const itemTitle =
          noteFiles.length === 1 && noteForm.title.trim()
            ? noteForm.title.trim()
            : file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
        fd.append('title', itemTitle);
        fd.append(
          'description',
          noteForm.description.trim() ||
            `Study material for ${notesModalCourse.title}${noteScope === 'chapter' ? ' (Chapter PDF)' : ' (Course PDF)'}`
        );
        fd.append('courseId', courseId);
        if (noteScope === 'chapter') {
          if (noteForm.subjectId) fd.append('subjectId', noteForm.subjectId);
          if (noteForm.chapterId) fd.append('chapterId', noteForm.chapterId);
        }
        fd.append('isFree', Boolean(noteForm.isFree));
        fd.append('price', noteForm.isFree ? 0 : Number(noteForm.price) || 0);
        fd.append('isPublished', true);
        fd.append('file', file);

        await createNote(fd);
        uploadedCount++;
      }

      toast.success(
        `Uploaded ${uploadedCount} PDF study material(s) to Google Drive for ${
          noteScope === 'chapter' ? 'selected chapter' : 'course'
        }!`
      );
      setNoteFiles([]);
      setNoteForm((prev) => ({ ...prev, title: '', description: '' }));
      const refreshed = await getAllNotes({ courseId, limit: 100 });
      setCourseNotesList(refreshed.data?.data?.notes || refreshed.data?.notes || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload PDF study material');
    } finally {
      setUploadingNote(false);
    }
  };

  const handleDeleteCourseNote = async (noteId) => {
    if (!notesModalCourse) return;
    const courseId = notesModalCourse.id || notesModalCourse._id;
    try {
      await deleteNote(noteId);
      toast.success('Study material removed');
      const refreshed = await getAllNotes({ courseId, limit: 100 });
      setCourseNotesList(refreshed.data?.data?.notes || refreshed.data?.notes || []);
    } catch {
      toast.error('Failed to delete study material');
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 0.35rem 0' }}>Manage Courses & YouTube Playlists</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            Create courses manually, import an entire YouTube playlist directly as a course in exact video order, or upload Course & Chapter PDFs to Google Drive.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => openPlaylistImporter(null)}
            className="btn btn-primary"
            style={{
              backgroundColor: '#dc2626',
              borderColor: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 700,
            }}
          >
            <FiYoutube size={18} /> Import YouTube Playlist as Course
          </button>
          <button
            onClick={() => openModal()}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FiPlus /> Add Course Manually
          </button>
        </div>
      </div>

      <div className="card-glass" style={{ padding: '1.5rem' }}>
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Course</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Instructor</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Level</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Price</th>
                <th style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>Quick Upload & Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No courses found. Click &ldquo;Import YouTube Playlist as Course&rdquo; or &ldquo;Add Course Manually&rdquo; above.
                  </td>
                </tr>
              ) : (
                courses.map((course) => {
                  const cId = course.id || course._id;
                  return (
                    <tr key={cId} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {course.thumbnail && (
                            <img
                              src={course.thumbnail}
                              alt={course.title}
                              style={{ width: '56px', height: '36px', objectFit: 'cover', borderRadius: '6px' }}
                            />
                          )}
                          <div>
                            <div>{course.title}</div>
                            <small style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                              {course.duration || `${course.totalLessons || 0} Lectures`}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>{course.instructor || 'SIDD Academy Faculty'}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <span className="badge badge-primary">{course.level || 'Class 12'}</span>
                      </td>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 700 }}>
                        {formatPrice(getEffectivePrice(course))}
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Link
                            to={`/admin/curriculum?courseId=${cId}`}
                            className="btn btn-sm btn-primary"
                            style={{
                              padding: '0.35rem 0.65rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              fontSize: '0.78rem',
                            }}
                            title="Manage Syllabus, Chapters, Bulk Videos & Notes"
                          >
                            <FiLayers /> Curriculum
                          </Link>
                          <button
                            type="button"
                            onClick={() => openPlaylistImporter(course)}
                            className="btn btn-sm btn-outline"
                            style={{
                              padding: '0.35rem 0.6rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.78rem',
                              color: '#dc2626',
                              borderColor: 'rgba(220,38,38,0.35)',
                            }}
                            title="Import a YouTube Playlist into this Course"
                          >
                            <FiYoutube /> + Playlist
                          </button>
                          <button
                            type="button"
                            onClick={() => openCourseNotesModal(course)}
                            className="btn btn-sm btn-outline"
                            style={{
                              padding: '0.35rem 0.6rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              fontSize: '0.78rem',
                            }}
                            title="Upload Course or Chapter PDF Study Notes to Google Drive"
                          >
                            <FiFileText /> + Notes PDF
                          </button>
                          <button
                            onClick={() => openModal(course)}
                            className="btn btn-sm btn-outline"
                            style={{ padding: '0.4rem' }}
                            title="Edit Course Details"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(cId)}
                            disabled={deletingId === cId}
                            className="btn btn-sm btn-danger"
                            style={{ padding: '0.4rem' }}
                            title="Delete Course"
                          >
                            <FiTrash2 />
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

      {/* 1. Standard Add / Edit Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        closeDisabled={submitting}
        title={editingId ? 'Edit Course' : 'Add Course'}
        size="lg"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Instructor</label>
              <input
                type="text"
                className="form-input"
                required
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows="4"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Level</label>
              <select
                className="form-select"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              >
                <option value="All Levels">All Levels</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
                <option value="Foundation">Foundation</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price (₹ INR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                className="form-input"
                disabled={formData.isFree}
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value === '' ? '' : Number(e.target.value) })
                }
              />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.isFree}
                  onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                  style={{ width: '20px', height: '20px' }}
                />
                <span>Is Free Course</span>
              </label>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Duration</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 55 Hours"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Course thumbnail</label>
              <input
                type="file"
                className="form-input"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
              <small style={{ color: 'var(--text-muted)' }}>
                {thumbnailFile
                  ? thumbnailFile.name
                  : editingId && formData.thumbnail
                  ? 'Current thumbnail will be kept unless replaced.'
                  : 'JPG, PNG, or WebP up to 5 MB.'}
              </small>
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
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. YouTube Playlist Direct Course / Chapter Importer Modal */}
      <Modal
        isOpen={playlistModalOpen}
        onClose={() => setPlaylistModalOpen(false)}
        closeDisabled={importingPlaylist || fetchingPlaylist}
        title={
          targetExistingCourse
            ? `Import YouTube Playlist into "${targetExistingCourse.title}"`
            : 'Import YouTube Playlist Directly as a Course'
        }
        size="lg"
      >
        <form onSubmit={handleImportPlaylistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Step 1: Playlist URL or Channel Preset */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-muted)',
              border: '1px solid var(--border)',
            }}
          >
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
              <FiYoutube color="#dc2626" size={18} />
              Step 1: Paste YouTube Playlist URL (or multiple YouTube video URLs)
            </label>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, minWidth: '240px' }}
                placeholder="https://www.youtube.com/playlist?list=PLKsilHHi-1ZQ"
                value={playlistInput}
                onChange={(e) => setPlaylistInput(e.target.value)}
              />
              <button
                type="button"
                onClick={() => handleFetchPlaylistPreview()}
                disabled={fetchingPlaylist}
                className="btn btn-primary"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 700 }}
              >
                {fetchingPlaylist ? 'Fetching Videos...' : 'Fetch & Arrange Playlist'}
              </button>
            </div>

            {/* Quick-pick from @Sidacademyprayagraj verified playlists */}
            <div style={{ marginTop: '0.75rem' }}>
              <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>
                Or 1-Click Load from @Sidacademyprayagraj Official Playlists:
              </small>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {OFFICIAL_CHANNEL_PLAYLISTS.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    disabled={fetchingPlaylist}
                    onClick={() => {
                      const url = `https://www.youtube.com/playlist?list=${pl.id}`;
                      setPlaylistInput(url);
                      handleFetchPlaylistPreview(url, pl);
                    }}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.74rem', padding: '0.25rem 0.55rem' }}
                  >
                    {pl.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Course & Curriculum Metadata */}
          {!targetExistingCourse && (
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Course Title</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="Auto-filled from YouTube Playlist"
                  value={playlistCourseForm.title}
                  onChange={(e) => setPlaylistCourseForm({ ...playlistCourseForm, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Instructor</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={playlistCourseForm.instructor}
                  onChange={(e) => setPlaylistCourseForm({ ...playlistCourseForm, instructor: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Subject Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Class 12 Chemistry"
                value={playlistCourseForm.subjectTitle}
                onChange={(e) => setPlaylistCourseForm({ ...playlistCourseForm, subjectTitle: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Chapter / Module Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Chapter 1: Complete Playlist Lectures"
                value={playlistCourseForm.chapterTitle}
                onChange={(e) => setPlaylistCourseForm({ ...playlistCourseForm, chapterTitle: e.target.value })}
              />
            </div>
          </div>

          {!targetExistingCourse && (
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Academic Level</label>
                <select
                  className="form-select"
                  value={playlistCourseForm.level}
                  onChange={(e) => setPlaylistCourseForm({ ...playlistCourseForm, level: e.target.value })}
                >
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                  <option value="Foundation">Foundation</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Course Price (₹ INR)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  disabled={playlistCourseForm.isFree}
                  value={playlistCourseForm.price}
                  onChange={(e) => setPlaylistCourseForm({ ...playlistCourseForm, price: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={playlistCourseForm.isFree}
                    onChange={(e) => setPlaylistCourseForm({ ...playlistCourseForm, isFree: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span>100% Free Course</span>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Ordered Playlist Videos Preview & Editor */}
          {playlistVideos.length > 0 && (
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <strong style={{ fontSize: '0.95rem' }}>
                  Ordered Playlist Videos ({playlistVideos.length} Lectures — Arranged as in YouTube Playlist)
                </strong>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => setPlaylistVideos((prev) => prev.map((v) => ({ ...v, isFree: true })))}
                  >
                    Mark All Free Preview
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => setPlaylistVideos((prev) => prev.map((v, i) => ({ ...v, isFree: i < 2 })))}
                  >
                    First 2 Free Only
                  </button>
                </div>
              </div>

              <div
                style={{
                  maxHeight: '280px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  paddingRight: '0.25rem',
                }}
              >
                {playlistVideos.map((vid, idx) => (
                  <div
                    key={`${vid.videoId}-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.55rem 0.75rem',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <span
                      style={{
                        minWidth: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--primary-subtle)',
                        color: 'var(--primary)',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      style={{ width: '64px', height: '38px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.84rem', height: 'auto' }}
                        value={vid.title}
                        onChange={(e) => updateVideoTitle(idx, e.target.value)}
                      />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {vid.duration}
                    </span>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(vid.isFree)}
                        onChange={() => toggleVideoFree(idx)}
                      />
                      Free
                    </label>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      <button
                        type="button"
                        onClick={() => movePlaylistVideo(idx, -1)}
                        disabled={idx === 0}
                        className="btn btn-sm btn-outline"
                        style={{ padding: '0.25rem' }}
                        title="Move Up"
                      >
                        <FiArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePlaylistVideo(idx, 1)}
                        disabled={idx === playlistVideos.length - 1}
                        className="btn btn-sm btn-outline"
                        style={{ padding: '0.25rem' }}
                        title="Move Down"
                      >
                        <FiArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePlaylistVideo(idx)}
                        className="btn btn-sm btn-danger"
                        style={{ padding: '0.25rem' }}
                        title="Remove Video"
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setPlaylistModalOpen(false)}
              className="btn btn-outline"
              disabled={importingPlaylist}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={importingPlaylist || (playlistVideos.length === 0 && !playlistInput.trim())}
              style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', fontWeight: 700 }}
            >
              {importingPlaylist
                ? 'Importing Playlist Videos...'
                : targetExistingCourse
                ? `Add ${playlistVideos.length || ''} Playlist Videos to Course`
                : `Create Course with ${playlistVideos.length || ''} Ordered Videos`}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Course & Chapter Study Notes Upload Modal (Direct to Google Drive) */}
      <Modal
        isOpen={Boolean(notesModalCourse)}
        onClose={() => setNotesModalCourse(null)}
        closeDisabled={uploadingNote}
        title={notesModalCourse ? `Study Notes & PDFs — ${notesModalCourse.title}` : 'Course & Chapter Study Notes'}
        size="lg"
      >
        {notesModalCourse && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Scope Selector: Entire Course vs Specific Chapter */}
            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-muted)', padding: '0.35rem', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => setNoteScope('course')}
                className={`btn btn-sm ${noteScope === 'course' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, border: 'none' }}
              >
                Upload for Entire Course
              </button>
              <button
                type="button"
                onClick={() => setNoteScope('chapter')}
                className={`btn btn-sm ${noteScope === 'chapter' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, border: 'none' }}
              >
                Upload for a Specific Subject & Chapter
              </button>
            </div>

            <form
              onSubmit={handleUploadCourseOrChapterNotes}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.9rem',
                padding: '1rem',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {noteScope === 'chapter' && (
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Select Subject</label>
                    <select
                      className="form-select"
                      value={noteForm.subjectId}
                      onChange={(e) => handleNoteSubjectChange(e.target.value)}
                    >
                      <option value="">-- Select Subject --</option>
                      {courseSubjects.map((s) => (
                        <option key={s.id || s._id} value={s.id || s._id}>
                          {s.name || s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Select Chapter</label>
                    <select
                      className="form-select"
                      value={noteForm.chapterId}
                      onChange={(e) => setNoteForm({ ...noteForm, chapterId: e.target.value })}
                    >
                      <option value="">-- Select Chapter --</option>
                      {courseChapters.map((ch) => (
                        <option key={ch.id || ch._id} value={ch.id || ch._id}>
                          {ch.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">PDF Title (optional if uploading multiple PDFs)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Chapter 1 Handwritten Formula Sheet"
                    value={noteForm.title}
                    onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Select PDF File(s) (Multi-select supported)</label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    multiple
                    className="form-input"
                    onChange={(e) => setNoteFiles(Array.from(e.target.files || []))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="checkbox"
                    checked={noteForm.isFree}
                    onChange={(e) => setNoteForm({ ...noteForm, isFree: e.target.checked })}
                  />
                  <span>Free Access for Students</span>
                </label>
                {!noteForm.isFree && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem' }}>Standalone Price (₹):</span>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      style={{ width: '100px' }}
                      value={noteForm.price}
                      onChange={(e) => setNoteForm({ ...noteForm, price: e.target.value })}
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={uploadingNote || noteFiles.length === 0}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <FiCloud />
                  {uploadingNote
                    ? 'Uploading to Google Drive...'
                    : `Upload ${noteFiles.length > 1 ? `${noteFiles.length} PDFs` : 'PDF'} to Google Drive`}
                </button>
              </div>
            </form>

            {/* Existing Notes for this Course */}
            <div>
              <h4 style={{ margin: '0 0 0.65rem 0', fontSize: '0.95rem' }}>
                Attached Google Drive Study Notes ({courseNotesList.length})
              </h4>
              {courseNotesList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                  No PDFs attached to this course yet. Upload one above to save it to Google Drive.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {courseNotesList.map((n) => {
                    const nId = n.id || n._id;
                    const driveUrl = getNoteDriveViewUrl(n);
                    return (
                      <div
                        key={nId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.6rem 0.85rem',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-muted)',
                          border: '1px solid var(--border)',
                          gap: '0.5rem',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{n.title}</div>
                          <small style={{ color: 'var(--text-muted)' }}>
                            {n.chapterTitle ? `Chapter: ${n.chapterTitle}` : 'Course-wide Study Material'} •{' '}
                            {n.isFree ? 'Free' : `₹${n.price || 0}`}
                          </small>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {driveUrl && (
                            <a
                              href={driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                            >
                              <FiExternalLink size={12} /> GDrive
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteCourseNote(nId)}
                            className="btn btn-sm btn-danger"
                            style={{ padding: '0.3rem 0.5rem' }}
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageCourses;
