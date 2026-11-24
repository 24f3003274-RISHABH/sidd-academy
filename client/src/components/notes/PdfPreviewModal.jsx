import React, { useEffect, useState } from 'react';
import { FiDownload, FiExternalLink, FiX, FiAlertCircle, FiFileText, FiMaximize2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { fetchNotePdfBlob, downloadNotePdfBlob } from '../../api/noteApi';
import { getNoteDriveViewUrl } from '../../utils/helpers';
import Loader from '../common/Loader';

const detectMobileBrowser = () => {
  if (typeof window === 'undefined') return false;
  const narrow = window.innerWidth <= 768;
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
  return narrow || mobileUa;
};

/**
 * Helper to trigger a genuine browser PDF file download using authenticated Blob fetch
 * (falls back to Google Drive view URL if external Drive-only).
 */
export const triggerNoteDownload = async (note) => {
  const noteId = note?.id || note?._id;
  const fallbackName = `${(note?.title || 'study-material').replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`;
  const fileName = note?.fileName || fallbackName;
  const driveViewUrl = getNoteDriveViewUrl(note);

  if (!noteId) {
    if (driveViewUrl) {
      window.open(driveViewUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    toast.error('Document download link is unavailable.');
    return;
  }

  try {
    const res = await downloadNotePdfBlob(noteId);
    const contentType = (res.headers?.['content-type'] || res.data?.type || '').toLowerCase();

    if (contentType.includes('application/pdf') || contentType.includes('octet-stream')) {
      const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      toast.success(`Downloading ${fileName}`);
      return;
    }

    if (driveViewUrl) {
      window.open(driveViewUrl, '_blank', 'noopener,noreferrer');
      toast.success('Opened study material in Google Drive');
      return;
    }

    toast.error('PDF file is currently unavailable on the server.');
  } catch (err) {
    if (driveViewUrl) {
      window.open(driveViewUrl, '_blank', 'noopener,noreferrer');
      toast.success('Opened study material in Google Drive');
      return;
    }
    let msg = 'This PDF file is not available for download. Please ask the administrator to re-upload it.';
    if (err.response?.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const parsed = JSON.parse(text);
        if (parsed?.message) msg = parsed.message;
      } catch {}
    } else if (err.response?.data?.message) {
      msg = err.response.data.message;
    }
    toast.error(msg);
  }
};

/**
 * Unified, mobile-friendly PDF Preview Modal.
 *
 * Always fetches authenticated PDF bytes via `/notes/:id/stream` (including server-side proxying
 * of public Google Drive PDFs) so modern browsers NEVER hit Google Drive's third-party cookie
 * wall ("Allow Google Drive access to your necessary cookies") inside an iframe!
 */
const PdfPreviewModal = ({ note, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isDriveRestricted, setIsDriveRestricted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isMobile, setIsMobile] = useState(detectMobileBrowser);
  const [forceInlineMobile, setForceInlineMobile] = useState(false);

  const noteId = note?.id || note?._id;
  const driveViewUrl = getNoteDriveViewUrl(note);

  useEffect(() => {
    const onResize = () => setIsMobile(detectMobileBrowser());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!note) return undefined;
    let active = true;
    let createdUrl = '';

    const loadPdf = async () => {
      setLoading(true);
      setErrorMsg('');
      setIsDriveRestricted(false);
      setBlobUrl('');
      setForceInlineMobile(false);

      if (!noteId) {
        setErrorMsg('Invalid study note reference.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetchNotePdfBlob(noteId);
        if (!active) return;

        const blob = res.data;
        const contentType = (res.headers?.['content-type'] || blob?.type || '').toLowerCase();

        // Guard: Verify the response is actually a PDF binary (never render raw JSON or Google HTML!)
        if (contentType.includes('application/pdf') || contentType.includes('octet-stream')) {
          const headerBytes = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
          const headerStr = String.fromCharCode(...headerBytes);
          if (headerStr.startsWith('%PDF-')) {
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            createdUrl = URL.createObjectURL(pdfBlob);
            setBlobUrl(createdUrl);
            setLoading(false);
            return;
          }
        }

        // Parse JSON message if server returned non-PDF
        let parsedMsg = 'This PDF preview could not be loaded inline. Please download or open it in a new tab.';
        if (blob instanceof Blob && contentType.includes('application/json')) {
          try {
            const parsed = JSON.parse(await blob.text());
            if (parsed?.code === 'DRIVE_DIRECT_OPEN_REQUIRED') {
              setIsDriveRestricted(true);
            }
            if (parsed?.message && !/stream access granted/i.test(parsed.message)) {
              parsedMsg = parsed.message;
            }
          } catch {}
        }
        if (driveViewUrl) {
          setIsDriveRestricted(true);
        }
        setErrorMsg(parsedMsg);
      } catch (err) {
        if (!active) return;
        let msg = 'Unable to load this PDF document inline. You can download it directly or open it in a new tab.';
        if (err.response?.data instanceof Blob) {
          try {
            const parsed = JSON.parse(await err.response.data.text());
            if (parsed?.code === 'DRIVE_DIRECT_OPEN_REQUIRED') {
              setIsDriveRestricted(true);
            }
            if (parsed?.message) msg = parsed.message;
          } catch {}
        } else if (err.response?.data?.message) {
          msg = err.response.data.message;
        } else if (err.message) {
          msg = err.message;
        }
        if (driveViewUrl && err.response?.status === 422) {
          setIsDriveRestricted(true);
        }
        setErrorMsg(msg);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPdf();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [noteId, driveViewUrl, note]);

  if (!note) return null;

  const handleDownloadClick = async () => {
    setDownloading(true);
    try {
      await triggerNoteDownload(note);
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenBlobTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="pdf-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={note.title}>
      <div className="pdf-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Responsive Modal Header */}
        <div className="pdf-modal-header">
          <div className="pdf-modal-title-row">
            <div className="pdf-modal-icon">
              <FiFileText size={18} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 className="pdf-modal-title">{note.title}</h3>
              <span className="pdf-modal-meta">
                {note.fileName || 'Study Document.pdf'} • {note.fileSize || 'PDF Document'}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="modal-close pdf-modal-close-mobile"
              aria-label="Close PDF preview"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="pdf-modal-actions">
            {blobUrl && (
              <button
                type="button"
                onClick={handleOpenBlobTab}
                className="btn btn-sm btn-outline"
              >
                <FiMaximize2 size={13} /> Open Full Screen
              </button>
            )}
            {driveViewUrl && (
              <a
                href={driveViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline"
              >
                <FiExternalLink size={13} /> Open in Drive
              </a>
            )}
            <button
              type="button"
              onClick={handleDownloadClick}
              disabled={downloading}
              className="btn btn-sm btn-primary"
            >
              <FiDownload size={13} /> {downloading ? 'Downloading…' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="modal-close pdf-modal-close-desktop"
              aria-label="Close PDF preview"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="pdf-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Loader size={36} label="Loading PDF document..." />
              <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                Preparing PDF document…
              </p>
            </div>
          ) : blobUrl && (!isMobile || forceInlineMobile) ? (
            <iframe
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              title={note.title}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : blobUrl && isMobile ? (
            /* Clean Mobile Native PDF Reader Card (mobile browsers don't scroll inline blob iframes well) */
            <div className="pdf-fallback-card">
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <FiFileText size={26} />
              </div>
              <h4 style={{ margin: '0 0 0.45rem 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                PDF Ready to Read
              </h4>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Open in your phone&apos;s full-screen PDF reader for smooth scrolling and pinch-to-zoom, or save a copy offline.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <button type="button" onClick={handleOpenBlobTab} className="btn btn-primary btn-full">
                  <FiMaximize2 size={15} /> Open Full-Screen PDF
                </button>
                <button type="button" onClick={handleDownloadClick} disabled={downloading} className="btn btn-outline btn-full">
                  <FiDownload size={15} /> {downloading ? 'Downloading…' : 'Download PDF to Device'}
                </button>
                <button
                  type="button"
                  onClick={() => setForceInlineMobile(true)}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                >
                  Try inline preview inside modal
                </button>
              </div>
            </div>
          ) : (
            <div className="pdf-fallback-card">
              <FiAlertCircle size={40} color="var(--secondary)" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {isDriveRestricted ? 'Open Study PDF in New Tab' : 'Document Preview Unavailable'}
              </h4>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {isDriveRestricted
                  ? 'This note is linked from Google Drive, which blocks embedded previews when browser privacy/cookie settings are active. Open it directly in Google Drive or download the PDF below.'
                  : errorMsg || 'This PDF file could not be rendered inline.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                {driveViewUrl && (
                  <a
                    href={driveViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-primary"
                  >
                    <FiExternalLink size={14} /> Open in Google Drive
                  </a>
                )}
                <button type="button" onClick={handleDownloadClick} disabled={downloading} className="btn btn-sm btn-outline">
                  <FiDownload size={14} /> {downloading ? 'Downloading…' : 'Download PDF'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
