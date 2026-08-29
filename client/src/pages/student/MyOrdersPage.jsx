import React, { useState, useEffect } from 'react';
import { getMyOrders } from '../../api/orderApi';
import StudentLayout from '../../components/student/StudentLayout';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { formatPrice, formatDate } from '../../utils/helpers';
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
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const getStatusPill = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID' || s === 'COMPLETED' || s === 'SUCCESS') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
          <FiCheckCircle size={14} /> PAID
        </span>
      );
    }
    if (s === 'PENDING') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
          <FiClock size={14} /> PENDING
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
          <FiAlertCircle size={14} /> FAILED
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
        <FiXCircle size={14} /> CANCELLED
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
            border: '1px solid rgba(239, 68, 68, 0.2)',
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
        <div className="card-glass" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: '16px', border: '1px dashed rgba(255, 255, 255, 0.15)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(108, 99, 255, 0.1)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: '1.5rem' }}>
            <FiPackage />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No orders found</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
            You haven't placed any orders yet. Browse our comprehensive courses and handwritten notes to begin learning!
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
          {orders.map((order) => (
            <div
              key={order.id || order._id}
              className="card-glass"
              style={{
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              {/* Order Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ORDER ID: <span style={{ fontFamily: 'monospace', color: '#fff' }}>{order.id || order._id}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Placed on: {formatDate(order.createdAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {getStatusPill(order.status || order.paymentStatus)}
                  <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
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
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
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
                            backgroundColor: isCourse ? 'rgba(108, 99, 255, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isCourse ? 'var(--accent)' : '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isCourse ? <FiBook size={18} /> : <FiFileText size={18} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Type: {isCourse ? 'Full Course Access' : 'Digital PDF Notes'}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {formatPrice(item.price || 0)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FiCreditCard /> Gateway Ref: {order.razorpayPaymentId || 'Direct Provision'}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(order.items || []).some(i => (i.itemType || i.item_type) === 'course') && (
                    <Link to="/student/my-courses" className="btn btn-sm btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Go to Courses <FiArrowRight />
                    </Link>
                  )}
                  {(order.items || []).some(i => (i.itemType || i.item_type) === 'note') && (
                    <Link to="/student/notes" className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      View Notes
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
};

export default MyOrdersPage;
