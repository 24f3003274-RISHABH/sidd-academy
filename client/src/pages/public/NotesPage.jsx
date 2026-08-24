import React, { useState, useEffect } from 'react';
import { getAllNotes, downloadNote } from '../../api/noteApi';
import { createOrder, verifyPayment } from '../../api/paymentApi';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';
import ModularNoteViewer from '../../components/notes/ModularNoteViewer';
import toast from 'react-hot-toast';
import { FiLayers, FiGrid, FiBookOpen } from 'react-icons/fi';

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [viewMode, setViewMode] = useState('modular'); // 'modular' | 'grid'

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await getAllNotes();
        if (res.data && res.data.notes) {
          setNotes(res.data.notes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, []);

  const handleDownload = async (id, title) => {
    if (!isAuthenticated) {
      toast.error('Please login to download notes');
      return;
    }
    try {
      toast.loading('Preparing download...', { id: 'download' });
      const res = await downloadNote(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Download started', { id: 'download' });
    } catch (err) {
      toast.error('Failed to download', { id: 'download' });
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
      toast.error('Please login to purchase notes');
      return;
    }
    setPaymentLoading(true);
    try {
      const res = await loadRazorpayScript();
      if (!res) throw new Error('Razorpay load failed');

      const orderRes = await createOrder({ items: [{ itemId: note._id, type: 'note', price: note.price }] });
      const { orderId, amount, currency } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test',
        amount: amount.toString(),
        currency,
        name: 'Sidd Academy',
        description: `Purchase Note: ${note.title}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful! You can now download the note.');
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#6c63ff' }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      toast.error('Failed to initiate payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#939aff', backgroundColor: 'rgba(108, 99, 255, 0.15)', padding: '0.35rem 0.9rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          <FiBookOpen /> Modular Study Materials (Subject &rarr; Chapter &rarr; PDF 1 / PDF 2)
        </div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem', fontWeight: 800 }}>
          Modular Notes & Formula PDFs
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
          Access organized handwritten notes, formula cheat-sheets, chapter summaries, and solved practice questions organized by Subject and Chapter.
        </p>
      </div>

      {loading ? (
        <Loader fullPage />
      ) : (
        <ModularNoteViewer
          notes={notes}
          onDownload={handleDownload}
          onPurchase={handlePurchase}
          isAuthenticated={isAuthenticated}
          user={user}
          isPurchasing={paymentLoading}
        />
      )}
    </div>
  );
};

export default NotesPage;

