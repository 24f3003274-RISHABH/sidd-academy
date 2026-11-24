import React, { useState, useEffect } from 'react';
import { getMyOrders, retryOrder, verifyPayment, cancelOrder, failOrder, getPaymentKey } from '../../api/orderApi';
import { clearGetCache } from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import StudentLayout from '../../components/student/StudentLayout';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { formatPrice, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiShoppingBag,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiXCircle,
  FiPackage,
  FiArrowRight,
  FiFileText,
  FiBook,
  FiCreditCard,
  FiRefreshCw,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const MyOrdersPage = () => {
  const { user, refreshUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryingOrderId, setRetryingOrderId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyOrders();
      const data = res.data?.data || res.data;
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load my orders', err);
      setError('Unable to fetch order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const loadRazorpayScript = () => {
    if (window.Razorpay) return Promise.resolve(true);
    const existingScript = document.querySelector('script[data-razorpay-checkout]');
    if (existingScript) {
      return new Promise((resolve) => {
        existingScript.addEventListener('load', () => resolve(true), { once: true });
        existingScript.addEventListener('error', () => resolve(false), { once: true });
      });
    }
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.dataset.razorpayCheckout = 'true';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRetryPayment = async (order) => {
    const targetOrderId = order.id || order._id;
    if (!targetOrderId || retryingOrderId) return;

    setRetryingOrderId(targetOrderId);
    let checkoutOpened = false;
    try {
      const res = await retryOrder(targetOrderId);
      const orderData = res.data?.data || res.data;

      if (orderData.isFree || orderData.status === 'PAID') {
        clearGetCache();
        if (refreshUser) await refreshUser();
        toast.success(orderData.message || 'Order completed!');
        fetchOrders();
        setRetryingOrderId(null);
        return;
      }

      const { orderId, razorpayOrderId, amount, currency, keyId, isMock } = orderData;

      let resolvedKey = (keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim();
      if (!resolvedKey) {
        try {
          const keyRes = await getPaymentKey();
          resolvedKey = (keyRes.data?.data?.key || keyRes.data?.key || '').trim();
        } catch {
          resolvedKey = '';
        }
      }

      if (isMock || !razorpayOrderId || razorpayOrderId.startsWith('order_mock_') || !resolvedKey) {
        throw new Error(
          'Razorpay payment gateway keys are not configured yet. Please add your live RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env.'
        );
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay checkout could not be loaded. Please check your connection and try again.');
      }

      const itemTitles = (order.items || []).map((i) => i.title).filter(Boolean).join(', ') || 'Course / Study Note';

      const options = {
        key: resolvedKey,
        amount: orderData.amountInPaise ? String(orderData.amountInPaise) : Math.round(Number(amount) * 100).toString(),
        currency: currency || 'INR',
        name: 'Sidd Academy',
        description: `Order Payment: ${itemTitles}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              orderId: orderId || targetOrderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearGetCache();
            if (refreshUser) await refreshUser();
            toast.success('Payment verified! Access has been unlocked.');
            setRetryingOrderId(null);
            fetchOrders();
          } catch (err) {
            setRetryingOrderId(null);
            toast.error(err.response?.data?.message || 'Payment verification failed.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: '#2563eb' },
        modal: {
          escape: true,
          backdropclose: false,
        },
      };

      const paymentObject = new window.Razorpay(options);
      const finishRetry = () => setRetryingOrderId(null);

      paymentObject.on('payment.failed', (resp) => {
        finishRetry();
        failOrder(orderId || targetOrderId).finally(() => fetchOrders());
        toast.error(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
      });

      paymentObject.on('modal.ondismiss', async () => {
        finishRetry();
        try {
          await cancelOrder(orderId || targetOrderId);
          toast('Checkout closed. You can retry payment anytime.', { icon: 'ℹ️' });
        } finally {
          fetchOrders();
        }
      });

      paymentObject.open();
      checkoutOpened = true;
      window.setTimeout(finishRetry, 60000);
    } catch (err) {
      setRetryingOrderId(null);
      toast.error(err.response?.data?.message || err.message || 'Could not initiate payment retry');
    } finally {
      if (!checkoutOpened) setRetryingOrderId(null);
    }
  };

  const getStatusPill = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID' || s === 'COMPLETED' || s === 'SUCCESS') {
      return (
        <span className="badge badge-success" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
          <FiCheckCircle size={13} /> Paid
        </span>
      );
    }
    if (s === 'PENDING' || s === 'CREATED') {
      return (
        <span className="badge badge-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
          <FiClock size={13} /> Pending checkout
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="badge badge-danger" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
          <FiAlertCircle size={13} /> Payment failed
        </span>
      );
    }
    return (
      <span className="badge badge-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
        <FiXCircle size={13} /> Checkout cancelled
      </span>
    );
  };

  return (
    <StudentLayout
      title="Purchase History & Invoices"
      subtitle="Review all your past transactions, enrolled courses, and purchased digital notes."
      actions={
        <Link to="/courses" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FiShoppingBag /> Browse Catalog
        </Link>
      }
    >
      {/* Loading Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SkeletonCard height="160px" count={3} />
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
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <FiAlertCircle size={40} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{error}</h3>
          <button onClick={fetchOrders} className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <div className="card-glass" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: '16px', border: '1px dashed var(--border)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: '1.5rem' }}>
            <FiPackage />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No orders found</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
            You haven&apos;t placed any orders yet. Browse our comprehensive courses and handwritten notes to begin learning!
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/courses" className="btn btn-primary">Explore Courses</Link>
            <Link to="/notes" className="btn btn-outline">Browse Notes</Link>
          </div>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && orders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((order) => {
            const ordId = order.id || order._id;
            const rawStatus = (order.status || order.paymentStatus || '').toUpperCase();
            const isPaid = rawStatus === 'PAID' || rawStatus === 'COMPLETED' || rawStatus === 'SUCCESS';
            const canRetry = !isPaid && Number(order.totalAmount || 0) > 0;
            const isRetryingThis = retryingOrderId === ordId;

            return (
              <div
                key={ordId}
                className="card-glass"
                style={{
                  borderRadius: '16px',
                  padding: '1.5rem',
                  border: '1px solid var(--border)',
                }}
              >
                {/* Order Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ORDER ID: <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)', fontWeight: 600 }}>{ordId}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Placed on: {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {getStatusPill(order.status || order.paymentStatus)}
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatPrice(order.totalAmount || 0)}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(order.items || []).map((item, idx) => {
                    const isCourse = (item.itemType || item.item_type) === 'course';
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: 'var(--bg-muted)',
                          border: '1px solid var(--border-subtle)',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              backgroundColor: isCourse ? 'var(--primary-subtle)' : 'var(--accent-subtle)',
                              color: isCourse ? 'var(--primary)' : 'var(--accent-dark)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isCourse ? <FiBook size={18} /> : <FiFileText size={18} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Type: {isCourse ? 'Full Course Access' : 'Digital PDF Notes'}
                            </div>
                          </div>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {formatPrice(item.price || 0)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FiCreditCard /> Gateway Ref: {order.razorpayPaymentId || order.razorpayOrderId || 'Direct Provision'}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {canRetry && (
                      <button
                        type="button"
                        onClick={() => handleRetryPayment(order)}
                        disabled={Boolean(retryingOrderId)}
                        className="btn btn-sm btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <FiRefreshCw size={13} />
                        {isRetryingThis ? 'Opening Checkout…' : `Retry Payment (${formatPrice(order.totalAmount)})`}
                      </button>
                    )}
                    {isPaid && (order.items || []).some(i => (i.itemType || i.item_type) === 'course') && (
                      <Link to="/student/my-courses" className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Go to Courses <FiArrowRight />
                      </Link>
                    )}
                    {isPaid && (order.items || []).some(i => (i.itemType || i.item_type) === 'note') && (
                      <Link to="/student/notes" className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        View Notes
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </StudentLayout>
  );
};

export default MyOrdersPage;
