import React, { useState, useMemo } from 'react';
import { FiFolder, FiFileText, FiDownload, FiEye, FiCheckCircle, FiSearch, FiLayers, FiBookOpen } from 'react-icons/fi';
import { formatFileSize, formatPrice } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ModularNoteViewer = ({ notes = [], onDownload, onPurchase, isAuthenticated, user, isPurchasing }) => {
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePdfPreview, setActivePdfPreview] = useState(null);

  // Group notes modularly by Subject and Chapter
  const subjectsList = useMemo(() => {
    const list = new Set();
    notes.forEach(n => {
      if (n.subject) list.add(typeof n.subject === 'object' ? n.subject.name : n.subject);
    });
    return ['All', ...Array.from(list)];
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const subjName = typeof n.subject === 'object' ? n.subject.name : n.subject;
      const matchesSubject = selectedSubject === 'All' || subjName === selectedSubject;
      const matchesQuery = !searchQuery || 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.description && n.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.level && n.level.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSubject && matchesQuery;
    });
  }, [notes, selectedSubject, searchQuery]);

  // Group by Subject -> Chapter
  const modularHierarchy = useMemo(() => {
    const map = {};
    filteredNotes.forEach(note => {
      const subj = typeof note.subject === 'object' ? note.subject.name : (note.subject || 'General');
      const chapter = note.chapterTitle || note.level || 'Master Notes';
      
      if (!map[subj]) map[subj] = {};
      if (!map[subj][chapter]) map[subj][chapter] = [];
      map[subj][chapter].push(note);
    });
    return map;
  }, [filteredNotes]);

  return (
    <div id="modular-note-viewer" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Controls Bar: Search & Subject Filters */}
      <div 
        className="card-glass" 
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 280px', position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search notes, chapters, formulas, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Subject Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>Subject:</span>
          {subjectsList.map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`btn btn-sm ${selectedSubject === subj ? 'btn-primary' : 'btn-outline'}`}
              style={{
                borderRadius: '20px',
                padding: '0.35rem 0.9rem',
                fontSize: '0.85rem',
                fontWeight: selectedSubject === subj ? 600 : 400,
              }}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Modular Structure Display: Subject -> Chapter -> Modular PDFs */}
      {Object.keys(modularHierarchy).length === 0 ? (
        <div className="card-glass" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FiLayers size={36} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No Modular Notes Found</h3>
          <p style={{ marginTop: '0.5rem' }}>Try clearing filters or search query.</p>
        </div>
      ) : (
        Object.entries(modularHierarchy).map(([subjectName, chapters]) => (
          <div 
            key={subjectName}
            id={`subject-section-${subjectName.replace(/\s+/g, '-').toLowerCase()}`}
            className="card-glass"
            style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
          >
            {/* Subject Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
              <div 
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(108, 99, 255, 0.15)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiFolder size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Modular Subject
                </span>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>
                  {subjectName}
                </h2>
              </div>
            </div>

            {/* Chapters & Modular PDFs list */}
            {Object.entries(chapters).map(([chapterTitle, noteList]) => (
              <div 
                key={chapterTitle}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#939aff' }}>
                  <FiBookOpen size={18} />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                    {chapterTitle}
                  </h3>
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem', marginLeft: 'auto' }}>
                    {noteList.length} {noteList.length === 1 ? 'Modular PDF' : 'Modular PDFs'}
                  </span>
                </div>

                {/* PDF 1, PDF 2, PDF 3 Modular Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {noteList.map((note, index) => {
                    const isPurchased = isAuthenticated && user?.purchasedNotes?.includes(note._id);
                    const canAccess = note.isFree || isPurchased;
                    const pdfLabel = `PDF ${index + 1}`;

                    return (
                      <div
                        key={note._id}
                        id={`pdf-module-${note._id}`}
                        style={{
                          backgroundColor: '#1b1c2b',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '10px',
                          padding: '1.2rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem',
                          position: 'relative',
                          transition: 'border-color 0.2s, transform 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--primary)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span 
                            style={{
                              backgroundColor: 'rgba(108, 99, 255, 0.2)',
                              color: '#939aff',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {pdfLabel}
                          </span>
                          <span 
                            style={{
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              color: note.isFree ? '#43e97b' : '#ff758c',
                            }}
                          >
                            {note.isFree ? 'Free' : formatPrice(note.price)}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <div 
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(255, 101, 132, 0.15)',
                              color: '#ff6584',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <FiFileText size={18} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
                              {note.title}
                            </h4>
                            {note.pageCount && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {note.pageCount} Pages • {formatFileSize(note.fileSize || 1024 * 1024 * 3)}
                              </span>
                            )}
                          </div>
                        </div>

                        {note.description && (
                          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.4, flex: 1 }}>
                            {note.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          {canAccess ? (
                            <>
                              <button
                                onClick={() => setActivePdfPreview(note)}
                                className="btn btn-sm btn-outline"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                              >
                                <FiEye size={13} /> Preview
                              </button>
                              <button
                                onClick={() => onDownload(note._id, note.title)}
                                className="btn btn-sm btn-primary"
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
                              >
                                <FiDownload size={13} /> Download
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => onPurchase(note)}
                              disabled={isPurchasing}
                              className="btn btn-sm btn-primary"
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                            >
                              Unlock {pdfLabel} ({formatPrice(note.price)})
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {/* PDF Modal Previewer */}
      {activePdfPreview && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setActivePdfPreview(null)}
        >
          <div 
            style={{
              backgroundColor: '#1b1c2b',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '900px',
              height: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{activePdfPreview.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Modular Study PDF Preview</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  onClick={() => onDownload(activePdfPreview._id, activePdfPreview.title)}
                  className="btn btn-sm btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <FiDownload size={14} /> Download PDF
                </button>
                <button 
                  onClick={() => setActivePdfPreview(null)}
                  className="btn btn-sm btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#2d3047' }}>
              <iframe
                src={activePdfPreview.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                title={activePdfPreview.title}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModularNoteViewer;
