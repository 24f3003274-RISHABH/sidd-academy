import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllNotes, getSecureAccess } from '../../api/noteApi';
import { createOrder, retryOrder } from '../../api/orderApi';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';
import NoteCard from '../../components/notes/NoteCard';
import ModularNoteViewer from '../../components/notes/ModularNoteViewer';
import PdfPreviewModal, { triggerNoteDownload } from '../../components/notes/PdfPreviewModal';
import PaymentStatusBanner from '../../components/common/PaymentStatusBanner';
import launchRazorpayCheckout from '../../utils/razorpayCheckout';
import toast from 'react-hot-toast';
import {
  FiLayers,
  FiGrid,
  FiBookOpen,
  FiSearch,
} from 'react-icons/fi';
import { clearGetCache } from '../../api/axiosInstance';

const NotesPage = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [purchasingNoteId, setPurchasingNoteId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'modular'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'free' | 'paid'
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePdfPreview, setActivePdfPreview] = useState(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await getAllNotes();
      const list = res.data?.data?.notes || res.data?.notes || [];
      setNotes(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load study notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Unique Subjects List
  const subjectsList = useMemo(() => {
    const list = new Set();
    notes.forEach((n) => {
      const s = n.subjectTitle || (typeof n.subject === 'object' ? n.subject?.name : n.subject);
      if (s) list.add(s);
    });
    return ['all', ...Array.from(list)];
  }, [notes]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Free / Paid Filter
      if (filterType === 'free' && !n.isFree) return false;
      if (filterType === 'paid' && n.isFree) return false;

      // Subject Filter
      if (selectedSubject !== 'all') {
        const s = n.subjectTitle || (typeof n.subject === 'object' ? n.subject?.name : n.subject);
        if (s !== selectedSubject) return false;
      }

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title && n.title.toLowerCase().includes(q);
        const matchesDesc = n.description && n.description.toLowerCase().includes(q);
        const matchesSubj = n.subjectTitle && n.subjectTitle.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesSubj) return false;
      }

      return true;
    });
  }, [notes, filterType, selectedSubject, searchQuery]);

  // Authenticated Secure PDF Download
  const handleDownload = async (id, title) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/notes' } });
      return;
    }
    try {
      toast.loading('Preparing PDF download...', { id: 'download' });
      const accessRes = await getSecureAccess(id);
      const accessData = accessRes.data?.data || accessRes.data;
      toast.dismiss('download');
      await triggerNoteDownload({ ...accessData, id, title: accessData?.title || title });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Access restricted. Please purchase note to unlock.', { id: 'download' });
    }
  };

  // Authenticated PDF Preview
  const handlePreview = async (note) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/notes' } });
      return;
    }
    try {
      toast.loading('Opening secure reader...', { id: 'preview' });
      const res = await getSecureAccess(note.id || note._id);
      const accessData = res.data?.data || res.data;
      setActivePdfPreview(accessData);
      toast.dismiss('preview');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Locked study note. Please purchase to view.', { id: 'preview' });
    }
  };

  const handlePurchase = async (note, retryOrderId = null) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/notes' } });
      return;
    }
    const noteId = note.id || note._id;
    setPaymentLoading(true);
    setPurchasingNoteId(noteId);
    setPaymentStatus(null);
    let checkoutOpened = false;
    try {
      const orderRes = retryOrderId
        ? await retryOrder(retryOrderId).catch(() =>
            createOrder({ items: [{ itemId: noteId, itemType: 'note' }] })
          )
        : await createOrder({ items: [{ itemId: noteId, itemType: 'note' }] });
      const orderData = orderRes.data?.data || orderRes.data;

      // If free note or 0 INR, unlocked immediately
      if (orderData.isFree || orderData.status === 'PAID') {
        clearGetCache();
        if (refreshUser) await refreshUser();
        toast.success(orderData.message || 'Digital note added to your library!');
        fetchNotes();
        setPaymentLoading(false);
        setPurchasingNoteId(null);
        return;
      }

      await launchRazorpayCheckout({
        orderData,
        fallbackOrderId: retryOrderId,
        description: `Digital Note: ${note.title}`,
        user,
        refreshUser,
        onVerifying: ({ orderId, razorpayPaymentId }) => {
          setPaymentStatus({
            status: 'verifying',
            title: `Verifying payment for "${note.title}"…`,
            message: 'Please hold on while we unlock your PDF note.',
            orderId,
            paymentId: razorpayPaymentId,
            note,
          });
        },
        onSuccess: ({ orderId }) => {
          setPaymentStatus({
            status: 'success',
            title: 'Note Unlocked!',
            message: `"${note.title}" is now unlocked in your Notes Library and ready to read or download.`,
            orderId,
            note,
          });
          toast.success('Payment verified! Digital note unlocked.');
          fetchNotes();
        },
        onFailed: ({ orderId, description, paymentId, modalClosed }) => {
          setPaymentStatus({
            status: 'failed',
            title: `Payment Failed — ${note.title}`,
            message: description || 'Your payment was declined or could not be completed. You can retry anytime.',
            orderId,
            paymentId,
            note,
          });
          if (!modalClosed) {
            toast.error(`Payment failed: ${description || 'Transaction declined'}`);
          }
        },
        onCancelled: ({ orderId, message }) => {
          setPaymentStatus({
            status: 'cancelled',
            title: `Checkout Cancelled — ${note.title}`,
            message: message || 'Checkout was closed before payment. No amount was deducted.',
            orderId,
            note,
          });
          toast('Checkout cancelled. No payment was charged.', { icon: 'ℹ️' });
          fetchNotes();
        },
        onVerificationError: ({ orderId, razorpayPaymentId, message }) => {
          setPaymentStatus({
            status: 'verification_error',
            title: 'Payment Verification Issue',
            message,
            orderId,
            paymentId: razorpayPaymentId,
            note,
          });
          toast.error(message);
        },
        onDone: () => {
          setPaymentLoading(false);
          setPurchasingNoteId(null);
        },
      });
      checkoutOpened = true;
    } catch (err) {
      setPaymentLoading(false);
      setPurchasingNoteId(null);
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      if (status === 401) {
        toast.error('Your session has expired. Please log in again.');
        navigate('/login', { state: { from: '/notes' } });
      } else if (status === 400 && serverMsg?.includes('already purchased')) {
        toast.success('You already have access to this note!');
        fetchNotes();
      } else {
        const msg = serverMsg || err.message || 'Failed to initiate purchase order';
        setPaymentStatus({
          status: 'failed',
          title: 'Could Not Start Checkout',
          message: msg,
          note,
        });
        toast.error(msg);
      }
    } finally {
      if (!checkoutOpened) {
        setPaymentLoading(false);
        setPurchasingNoteId(null);
      }
    }
  };

  return (
    <div className="container" style={{ padding: 'clamp(1.75rem, 4vw, 3.5rem) 0' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--primary-dark)',
            backgroundColor: 'var(--primary-subtle)',
            border: '1px solid var(--primary-border)',
            padding: '0.35rem 0.9rem',
            borderRadius: '20px',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
          }}
        >
          <FiBookOpen /> Sidd Academy Digital Notes &amp; Study PDFs
        </div>
        <h1 style={{ fontSize: 'clamp(1.65rem, 4.5vw, 2.5rem)', marginBottom: '0.65rem', fontWeight: 800 }}>
          Digital Notes &amp; Study Materials
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.96rem', lineHeight: 1.6 }}>
          Access curated handwritten topper notes, formula cheat-sheets, solved board questions, and chapter revisions with instant access verification.
        </p>
      </div>

      {/* Filter & View Controls */}
      <div
        className="card-glass"
        style={{
          padding: '1rem 1.15rem',
          borderRadius: '12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.85rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.75rem',
        }}
      >
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 220px', position: 'relative', minWidth: 0 }}>
          <FiSearch style={{ position: 'absolute', left: '0.9rem', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search notes, chapters, formulas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Access Type Badges: All / Free / Paid */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterType('all')}
            className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '20px', padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}
          >
            All Notes ({notes.length})
          </button>
          <button
            onClick={() => setFilterType('free')}
            className={`btn btn-sm ${filterType === 'free' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '20px', padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}
          >
            Free Notes
          </button>
          <button
            onClick={() => setFilterType('paid')}
            className={`btn btn-sm ${filterType === 'paid' ? 'btn-primary' : 'btn-outline'}`}
            style={{ borderRadius: '20px', padding: '0.35rem 0.9rem', fontSize: '0.85rem' }}
          >
            Premium Paid
          </button>
        </div>

        {/* Subject Filter Dropdown */}
        {subjectsList.length > 2 && (
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '175px' }}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            aria-label="Filter notes by subject"
          >
            <option value="all">All Subjects</option>
            {subjectsList
              .filter((s) => s !== 'all')
              .map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
          </select>
        )}

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => setViewMode('grid')}
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.4rem 0.6rem' }}
            title="Grid View"
          >
            <FiGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('modular')}
            className={`btn btn-sm ${viewMode === 'modular' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.4rem 0.6rem' }}
            title="Modular Subject Hierarchy View"
          >
            <FiLayers size={15} />
          </button>
        </div>
      </div>

      {paymentStatus && (
        <div style={{ marginBottom: '1.5rem' }}>
          <PaymentStatusBanner
            status={paymentStatus.status}
            title={paymentStatus.title}
            message={paymentStatus.message}
            orderId={paymentStatus.orderId}
            paymentId={paymentStatus.paymentId}
            retrying={paymentLoading}
            onRetry={
              paymentStatus.note && (paymentStatus.status === 'failed' || paymentStatus.status === 'cancelled')
                ? () => handlePurchase(paymentStatus.note, paymentStatus.orderId || null)
                : undefined
            }
            retryLabel={paymentStatus.status === 'failed' ? 'Retry Payment' : 'Resume Checkout'}
            onDismiss={() => setPaymentStatus(null)}
          />
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <Loader fullPage />
      ) : viewMode === 'modular' ? (
        <ModularNoteViewer
          notes={filteredNotes}
          onDownload={handleDownload}
          onPurchase={handlePurchase}
          onPreview={handlePreview}
          isAuthenticated={isAuthenticated}
          user={user}
          isPurchasing={paymentLoading}
          purchasingNoteId={purchasingNoteId}
        />
      ) : (
        <div>
          {filteredNotes.length === 0 ? (
            <div className="card-glass" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FiBookOpen size={42} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3>No digital notes found</h3>
              <p style={{ marginTop: '0.5rem' }}>Try adjusting your filters or search keywords.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id || note._id}
                  note={note}
                  onDownload={handleDownload}
                  onPurchase={handlePurchase}
                  onPreview={handlePreview}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  isPurchasing={paymentLoading}
                  purchasingNoteId={purchasingNoteId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Unified Authenticated PDF Modal Reader */}
      {activePdfPreview && (
        <PdfPreviewModal
          note={activePdfPreview}
          onClose={() => setActivePdfPreview(null)}
        />
      )}
    </div>
  );
};

export default NotesPage;
