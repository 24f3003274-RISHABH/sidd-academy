import React, { useState, useEffect } from 'react';
import { getAllOrders } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';
import { FiSearch, FiFilter, FiCheckCircle, FiClock, FiAlertCircle, FiXCircle, FiEye, FiX } from 'react-icons/fi';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await getAllOrders(params);
      const data = res.data?.data || res.data;
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID' || s === 'COMPLETED' || s === 'SUCCESS') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
          <FiCheckCircle size={12} /> PAID
        </span>
      );
    }
    if (s === 'PENDING' || s === 'CREATED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
          <FiClock size={12} /> PENDING
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
          <FiAlertCircle size={12} /> FAILED
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#9ca3af', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
          <FiXCircle size={12} /> CANCELLED
        </span>
      );
    }
    return (
      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', backgroundColor: 'rgba(255,255,255,0.1)' }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Orders & Transactions</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Monitor student course enrollments, digital note purchases, and gateway transaction audits.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-glass" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px', position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by Order ID, student name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-sm btn-primary" style={{ whiteSpace: 'nowrap' }}>
            Search
          </button>
        </form>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['ALL', 'PAID', 'PENDING', 'FAILED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '20px', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="card-glass" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <Loader />
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Order ID</th>
                  <th style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Student</th>
                  <th style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Items</th>
                  <th style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total Amount</th>
                  <th style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Date</th>
                  <th style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</th>
                  <th style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No orders found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id || order._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                        {(order.id || order._id).substring(0, 16)}...
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{order.user?.name || 'Student'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.user?.email}</div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontSize: '0.9rem' }}>
                        {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontWeight: 700, fontSize: '0.95rem' }}>
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {formatDate(order.createdAt)}
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        {getStatusBadge(order.status || order.paymentStatus)}
                      </td>
                      <td style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="btn btn-sm btn-outline"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                        >
                          <FiEye /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="card-glass"
            style={{
              width: '100%',
              maxWidth: '650px',
              backgroundColor: '#121526',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '16px',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.3rem' }}>Order Details</h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  ID: {selectedOrder.id || selectedOrder._id}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                <FiX />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Customer</div>
                <div style={{ fontWeight: 600 }}>{selectedOrder.user?.name || 'Student'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedOrder.user?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Order Status</div>
                {getStatusBadge(selectedOrder.status || selectedOrder.paymentStatus)}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Created Date</div>
                <div style={{ fontSize: '0.9rem' }}>{formatDate(selectedOrder.createdAt)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Amount</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)' }}>{formatPrice(selectedOrder.totalAmount)}</div>
              </div>
            </div>

            {/* Line Items */}
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Purchased Items</h3>
            <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              {(selectedOrder.items || []).map((item, idx) => (
                <div
                  key={item.id || item._id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.85rem 1rem',
                    borderBottom: idx === (selectedOrder.items?.length || 0) - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(108, 99, 255, 0.2)', color: '#939aff', marginRight: '8px', fontWeight: 600 }}>
                      {item.itemType || 'course'}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.title}</span>
                  </div>
                  <div style={{ fontWeight: 700 }}>{formatPrice(item.price)}</div>
                </div>
              ))}
            </div>

            {/* Gateway Audit Info */}
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Gateway Audit & Verification</h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace' }}>
              <div>Razorpay Order ID: <span style={{ color: '#fff' }}>{selectedOrder.razorpayOrderId || 'N/A (Free/Direct)'}</span></div>
              <div>Razorpay Payment ID: <span style={{ color: '#fff' }}>{selectedOrder.razorpayPaymentId || 'N/A'}</span></div>
              <div>Receipt: <span style={{ color: '#fff' }}>{selectedOrder.receipt || 'N/A'}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
