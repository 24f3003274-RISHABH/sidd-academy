import React, { useState, useEffect, useMemo } from 'react';
import { getMyOrders, retryOrder } from '../../api/orderApi';
import { clearGetCache } from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import StudentLayout from '../../components/student/StudentLayout';
import PaymentStatusBanner from '../../components/common/PaymentStatusBanner';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { formatPrice, formatDate } from '../../utils/helpers';
import launchRazorpayCheckout from '../../utils/razorpayCheckout';
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
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter((order) => {
      const s = (order.status || order.paymentStatus || '').toUpperCase();
      if (statusFilter === 'PAID') return s === 'PAID' || s === 'COMPLETED' || s === 'SUCCESS';
      if (statusFilter === 'PENDING') return s === 'PENDING' || s === 'CREATED';
      return s === statusFilter;
    });
  }, [orders, statusFilter]);

  const handleRetryPayment = async (order) => {
    const targetOrderId = order.id || order._id;
    if (!targetOrderId || retryingOrderId) return;

    setRetryingOrderId(targetOrderId);
    setPaymentStatus(null);
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

      const itemTitles = (order.items || []).map((i) => i.title).filter(Boolean).join(', ') || 'Course / Study Note';

      await launchRazorpayCheckout({
        orderData,
        fallbackOrderId: targetOrderId,
        description: `Order Payment: ${itemTitles}`,
        user,
        refreshUser,
        onVerifying: ({ orderId, razorpayPaymentId }) => {
          setPaymentStatus({
            status: 'verifying',
            title: 'Verifying Your Payment…',
            message: `Confirming payment for ${itemTitles}.`,
            orderId,
            paymentId: razorpayPaymentId,
            order,
          });
        },
        onSuccess: ({ orderId }) => {
          setPaymentStatus({
            status: 'success',
            title: 'Payment Verified!',
            message: `Access to ${itemTitles} has been unlocked on your account.`,
            orderId,
          });
          toast.success('Payment verified! Access has been unlocked.');
          fetchOrders();
        },
        onFailed: ({ orderId, description, paymentId, modalClosed }) => {
          setPaymentStatus({
            status: 'failed',
            title: 'Payment Failed',
            message: description || 'Transaction was declined. You can retry with another payment method.',
            orderId,
            paymentId,
            order,
          });
          if (!modalClosed) {
            toast.error(`Payment failed: ${description || 'Transaction declined'}`);
          }
          fetchOrders();
        },
        onCancelled: ({ orderId, message }) => {
          setPaymentStatus({
            status: 'cancelled',
            title: 'Checkout Cancelled',
            message: message || 'Checkout was closed before payment. No amount was deducted.',
            orderId,
            order,
          });
          toast('Checkout closed. You can retry payment anytime.', { icon: 'ℹ️' });
          fetchOrders();
        },
        onVerificationError: ({ orderId, razorpayPaymentId, message }) => {
          setPaymentStatus({
            status: 'verification_error',
            title: 'Payment Verification Issue',
            message,
            orderId,
            paymentId: razorpayPaymentId,
            order,
          });
          toast.error(message);
          fetchOrders();
        },
        onDone: () => {
          setRetryingOrderId(null);
        },
      });
      checkoutOpened = true;
    } catch (err) {
      setRetryingOrderId(null);
      const msg = err.response?.data?.message || err.message || 'Could not initiate payment retry';
      setPaymentStatus({
        status: 'failed',
        title: 'Could Not Restart Checkout',
        message: msg,
        orderId: targetOrderId,
        order,
      });
      toast.error(msg);
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

      {/* Live Payment Status Banner */}
      {paymentStatus && (
        <div style={{ marginBottom: '1.25rem' }}>
          <PaymentStatusBanner
            status={paymentStatus.status}
            title={paymentStatus.title}
            message={paymentStatus.message}
            orderId={paymentStatus.orderId}
            paymentId={paymentStatus.paymentId}
            showOrdersLink={false}
            retrying={Boolean(retryingOrderId)}
            onRetry={
              paymentStatus.order && (paymentStatus.status === 'failed' || paymentStatus.status === 'cancelled')
                ? () => handleRetryPayment(paymentStatus.order)
                : undefined
            }
            retryLabel={paymentStatus.status === 'failed' ? 'Retry Payment' : 'Resume Checkout'}
            onDismiss={() => setPaymentStatus(null)}
          />
        </div>
      )}

      {/* Status Filter Pills */}
      {!loading && !error && orders.length > 0 && (
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {[
            { key: 'ALL', label: `All (${orders.length})` },
            { key: 'PAID', label: 'Paid' },
            { key: 'PENDING', label: 'Pending' },
            { key: 'FAILED', label: 'Failed' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`btn btn-sm ${statusFilter === tab.key ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '999px', padding: '0.32rem 0.85rem', fontSize: '0.8rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && orders.length > 0 && filteredOrders.length === 0 && (
        <div className="card-glass" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', borderRadius: '14px' }}>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
            No orders found with status <strong>{statusFilter}</strong>.
          </p>
          <button type="button" onClick={() => setStatusFilter('ALL')} className="btn btn-sm btn-outline">
            Show All Orders
          </button>
        </div>
      )}

      {!loading && !error && filteredOrders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredOrders.map((order) => {
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

                {/* Failure / Cancellation Explanation */}
                {!isPaid && (rawStatus === 'FAILED' || rawStatus === 'CANCELLED') && (
                  <div
                    style={{
                      marginBottom: '0.85rem',
                      padding: '0.65rem 0.9rem',
                      borderRadius: '8px',
                      backgroundColor: rawStatus === 'FAILED' ? '#fef2f2' : '#fffbeb',
                      border: `1px solid ${rawStatus === 'FAILED' ? '#fecaca' : '#fde68a'}`,
                      color: rawStatus === 'FAILED' ? '#991b1b' : '#92400e',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {rawStatus === 'FAILED' ? <FiAlertCircle size={15} /> : <FiXCircle size={15} />}
                    <span>
                      {rawStatus === 'FAILED'
                        ? (order.failureReason || 'Payment could not be completed. Click Retry Payment to try again.')
                        : 'Checkout was closed before payment. No amount was deducted — you can resume anytime.'}
                    </span>
                  </div>
                )}

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
