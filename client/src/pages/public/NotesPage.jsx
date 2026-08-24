import React, { useState, useEffect } from 'react';
import { getAllNotes, downloadNote } from '../../api/noteApi';
import { createOrder, verifyPayment } from '../../api/paymentApi';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';
import { formatPrice, formatFileSize } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { FiDownload, FiDollarSign, FiFileText } from 'react-icons/fi';

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const [paymentLoading, setPaymentLoading] = useState(false);

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
            // Ideally, refresh user data or note status
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
    <div className="container" style={{ padding: '4rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Notes Library</h1>
        <p style={{ color: 'var(--text-muted)' }}>High-quality, structured notes for all subjects</p>
      </div>

      {loading ? (
        <Loader fullPage />
      ) : (
        <div className="grid-3">
          {notes.map(note => {
            const hasPurchased = isAuthenticated && user?.purchasedNotes?.includes(note._id);
            const canDownload = note.isFree || hasPurchased;

            return (
              <div key={note._id} className="note-card card-glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(108, 99, 255, 0.1)', borderRadius: '8px', color: 'var(--primary)' }}>
                    <FiFileText size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{note.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{note.subject?.name || 'Subject'}</p>
                  </div>
                </div>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>{note.description}</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: note.isFree ? 'var(--accent)' : 'var(--primary)' }}>
                      {note.isFree ? 'Free' : formatPrice(note.price)}
                    </span>
                    {note.fileSize && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({formatFileSize(note.fileSize)})</span>}
                  </div>
                  
                  {canDownload ? (
                    <button onClick={() => handleDownload(note._id, note.title)} className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiDownload /> Download
                    </button>
                  ) : (
                    <button onClick={() => handlePurchase(note)} disabled={paymentLoading} className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiDollarSign /> {paymentLoading ? 'Wait' : 'Buy Now'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && notes.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No notes available right now.</div>
      )}
    </div>
  );
};

export default NotesPage;
