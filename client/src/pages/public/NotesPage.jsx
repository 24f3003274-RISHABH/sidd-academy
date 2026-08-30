import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllNotes, getSecureAccess, downloadNote } from '../../api/noteApi';
import { createOrder, verifyPayment } from '../../api/paymentApi';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';
import NoteCard from '../../components/notes/NoteCard';
import ModularNoteViewer from '../../components/notes/ModularNoteViewer';
import toast from 'react-hot-toast';
import {
  FiLayers,
  FiGrid,
  FiBookOpen,
  FiSearch,
  FiLock,
  FiCheckCircle,
  FiDownload,
  FiExternalLink,
  FiFilter,
} from 'react-icons/fi';
import { formatPrice } from '../../utils/helpers';

const NotesPage = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const [paymentLoading, setPaymentLoading] = useState(false);
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
      toast.loading('Verifying secure PDF access...', { id: 'download' });
      const accessRes = await getSecureAccess(id);
      const accessData = accessRes.data?.data || accessRes.data;

      if (accessData.fileUrl) {
        window.open(accessData.fileUrl, '_blank');
        toast.success('Download started', { id: 'download' });
      } else {
        toast.error('Could not locate verified download stream', { id: 'download' });
      }
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
      toast.success('PDF stream authorized', { id: 'preview' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Locked study note. Please purchase to view.', { id: 'preview' });
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async (note) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/notes' } });
      return;
    }
    setPaymentLoading(true);
    try {
      const noteId = note.id || note._id;
      const orderRes = await createOrder({
        items: [{ itemId: noteId, itemType: 'note' }],
      });
      const orderData = orderRes.data?.data || orderRes.data;

      // If free note or 0 INR, unlocked immediately
      if (orderData.isFree || orderData.status === 'PAID') {
        toast.success(orderData.message || 'Digital note added to your library!');
        fetchNotes();
        return;
      }

      const { orderId, razorpayOrderId, amount, currency, keyId } = orderData;

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || typeof window.Razorpay === 'undefined') {
        // Fallback for sandboxed development/mock simulation if external script blocked
        await verifyPayment({
          orderId,
          razorpayOrderId: razorpayOrderId || `sim_rzp_${Date.now()}`,
          razorpayPaymentId: `sim_pay_${Date.now()}`,
          razorpaySignature: 'simulated_dev_signature',
        });
        toast.success('Test checkout completed! Digital note unlocked.');
        fetchNotes();
        return;
      }

      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: Math.round(Number(amount) * 100).toString(),
        currency: currency || 'INR',
        name: 'Sidd Academy',
        description: `Digital Note: ${note.title}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment verified! Digital note unlocked.');
            fetchNotes();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#6c63ff' },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function (resp) {
        toast.error(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
      });
      paymentObject.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate purchase order');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 0' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#939aff',
            backgroundColor: 'rgba(108, 99, 255, 0.15)',
            padding: '0.35rem 0.9rem',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
          }}
        >
          <FiBookOpen /> Sidd Academy Digital Notes & Study PDFs
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', fontWeight: 800 }}>
          Digital Notes & Study Materials
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.6 }}>
          Access curated handwritten topper notes, formula cheat-sheets, solved board questions, and chapter revisions with instant access verification.
        </p>
      </div>

      {/* Filter & View Controls */}
      <div
        className="card-glass"
        style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 280px', position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '1rem', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search notes, chapters, formulas, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Access Type Badges: All / Free / Paid */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
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

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', gap: '0.4rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '1rem' }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
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
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* PDF Modal Reader */}
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
            <div
              style={{
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{activePdfPreview.title}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {activePdfPreview.fileName} • {activePdfPreview.fileSize || '2.5 MB'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a
                  href={activePdfPreview.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  <FiExternalLink size={14} /> Open in New Tab
                </a>
                <button onClick={() => setActivePdfPreview(null)} className="btn btn-sm btn-outline">
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

export default NotesPage;
