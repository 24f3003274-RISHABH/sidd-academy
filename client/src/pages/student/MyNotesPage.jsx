import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getStudentNotes } from '../../api/studentApi';
import { getSecureAccess } from '../../api/noteApi';
import StudentLayout from '../../components/student/StudentLayout';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import toast from 'react-hot-toast';
import {
  FiFileText,
  FiDownload,
  FiEye,
  FiSearch,
  FiFilter,
  FiExternalLink,
  FiCompass,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';

const MyNotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [previewNote, setPreviewNote] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getStudentNotes();
      const noteList = res.data?.data?.notes || res.data?.notes || [];
      setNotes(noteList);
    } catch (err) {
      console.error('Failed to load student notes:', err);
      setError('Unable to load your purchased notes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Unique subjects for filter tabs
  const subjects = useMemo(() => {
    const set = new Set();
    notes.forEach((n) => {
      if (n.subjectName) set.add(n.subjectName);
    });
    return Array.from(set);
  }, [notes]);

  // Filtered notes list
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.subjectName && n.subjectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.description && n.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchSearch) return false;

      if (subjectFilter !== 'ALL') {
        return n.subjectName === subjectFilter;
      }
      return true;
    });
  }, [notes, searchQuery, subjectFilter]);

  const handleDownload = async (note) => {
    try {
      const id = note.id || note._id;
      setDownloadingId(id);
      const res = await getSecureAccess(id);
      const fileUrl = res.data?.data?.fileUrl || res.data?.fileUrl || note.fileUrl;

      toast.success(`Starting download: ${note.title}`);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.download = `${note.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error('Failed to generate secure note download link');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <StudentLayout
      title="My Purchased Notes"
      subtitle="Access, read online, and securely download your handwritten study material, formula sheets, and chapter notes."
      actions={
        <Link to="/notes" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FiCompass /> Browse Notes Store
        </Link>
      }
    >
      {/* Search and Subject Toolbar */}
      <div
        className="card-glass"
        style={{
          padding: '1rem 1.25rem',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search notes by chapter or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        {subjects.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSubjectFilter('ALL')}
              className={`btn btn-sm ${subjectFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
              style={{ border: 'none', fontSize: '0.8rem' }}
            >
              All Subjects ({notes.length})
            </button>
            {subjects.map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => setSubjectFilter(subj)}
                className={`btn btn-sm ${subjectFilter === subj ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none', fontSize: '0.8rem' }}
              >
                {subj}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <SkeletonCard height="200px" count={3} />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          className="card-glass"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <FiAlertCircle size={40} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{error}</h3>
          <button onClick={fetchNotes} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && notes.length === 0 && (
        <div
          className="card-glass"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              margin: '0 auto 1.5rem auto',
            }}
          >
            <FiFileText />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No Notes Purchased Yet
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '460px', margin: '0 auto 1.5rem auto', fontSize: '0.95rem' }}>
            Access topper-handwritten notes, quick formula sheets, and chapter summaries from our notes library.
          </p>
          <Link to="/notes" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiCompass /> Explore Notes Store
          </Link>
        </div>
      )}

      {/* Notes Grid */}
      {!loading && !error && filteredNotes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredNotes.map((note) => (
            <div
              key={note.id || note._id}
              className="card-glass hover-scale"
              style={{
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FiCheckCircle size={12} /> {note.subjectName || 'Study Notes'}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {note.fileSize || '2.8 MB'}
                </span>
              </div>

              <div>
                <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.35 }}>
                  {note.title}
                </h3>
                {note.courseTitle && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Course: {note.courseTitle}
                  </div>
                )}
                {note.description && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0 0 0', lineHeight: 1.4 }}>
                    {note.description.length > 90 ? `${note.description.substring(0, 90)}...` : note.description}
                  </p>
                )}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setPreviewNote(note)}
                  className="btn btn-outline"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
                >
                  <FiEye /> Read Online
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(note)}
                  disabled={downloadingId === (note.id || note._id)}
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
                >
                  <FiDownload /> {downloadingId === (note.id || note._id) ? 'Downloading...' : 'Download'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Modal Viewer */}
      {previewNote && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setPreviewNote(null)}
        >
          <div
            className="card-glass"
            style={{
              width: '100%',
              maxWidth: '960px',
              height: '88vh',
              backgroundColor: '#131728',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>{previewNote.title}</h3>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Subject: {previewNote.subjectName}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleDownload(previewNote)}
                  className="btn btn-sm btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <FiDownload /> Download PDF
                </button>
                <button onClick={() => setPreviewNote(null)} className="btn btn-sm btn-outline">
                  Close
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#0b0e17' }}>
              <iframe
                src={`${previewNote.fileUrl}#toolbar=1`}
                title={previewNote.title}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default MyNotesPage;
