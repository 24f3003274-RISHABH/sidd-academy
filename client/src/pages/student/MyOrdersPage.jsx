import React, { useState, useEffect } from 'react';
import { getMyOrders } from '../../api/orderApi';
import Loader from '../../components/common/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';
import { FiShoppingBag, FiCheckCircle, FiClock, FiAlertCircle, FiXCircle, FiPackage, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getMyOrders();
        const data = res.data?.data || res.data;
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Failed to load my orders', err);
      } finally {
        setLoading(false);
      }
    };
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

  if (loading) return <Loader fullPage />;

  return (
    <div className="container" style={{ padding: '3.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>Purchase History & Orders</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            View your enrolled courses, purchased digital notes, and payment receipts.
          </p>
        </div>
        <Link to="/courses" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <FiShoppingBag /> Browse More Courses
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="card-glass" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: '16px' }}>
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
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((order) => (
            <div
              key={order.id || order._id}
              className="card-glass"
              style={{
                borderRadius: '16px',
                padding: '1.5rem',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Order Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order ID</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', fontFamily: 'monospace' }}>{order.id || order._id}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Placed on {formatDate(order.createdAt)}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  {getStatusPill(order.status || order.paymentStatus)}
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)', marginTop: '4px' }}>
                    {formatPrice(order.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Order Line Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(order.items || []).map((item, idx) => (
                  <div
                    key={item.id || item._id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          textTransform: 'uppercase',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: item.itemType === 'note' ? 'rgba(255, 101, 132, 0.15)' : 'rgba(108, 99, 255, 0.15)',
                          color: item.itemType === 'note' ? '#ff6584' : '#939aff',
                        }}
                      >
                        {item.itemType || 'course'}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.title}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontWeight: 700 }}>{formatPrice(item.price)}</span>
                      {item.itemType === 'course' ? (
                        <Link
                          to={`/courses/${item.itemId}`}
                          className="btn btn-sm btn-outline"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                        >
                          View Course <FiArrowRight size={12} />
                        </Link>
                      ) : (
                        <Link
                          to="/notes"
                          className="btn btn-sm btn-outline"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
                        >
                          View Notes <FiArrowRight size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Transaction footer audit notes */}
              {order.razorpayPaymentId && (
                <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  Transaction Ref: {order.razorpayPaymentId}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
