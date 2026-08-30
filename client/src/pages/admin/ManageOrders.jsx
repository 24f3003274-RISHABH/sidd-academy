import React, { useState, useEffect } from 'react';
import { getAllOrders } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';
import { FiSearch, FiCheckCircle, FiClock, FiAlertCircle, FiXCircle, FiEye, FiX } from 'react-icons/fi';

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
      setOrders(data.orders || (Array.isArray(data) ? data : []));
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
        <span className="badge badge-success">
          <FiCheckCircle size={12} /> PAID
        </span>
      );
    }
    if (s === 'PENDING' || s === 'CREATED') {
      return (
        <span className="badge badge-secondary">
          <FiClock size={12} /> PENDING
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="badge badge-danger">
          <FiAlertCircle size={12} /> FAILED
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <span className="badge badge-outline">
          <FiXCircle size={12} /> CANCELLED
        </span>
      );
    }
    return (
      <span className="badge badge-outline">
        {status}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Orders & Transactions</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Monitor student course enrollments, digital note purchases, and gateway transaction audits.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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
      <div className="card" style={{ padding: '1.25rem' }}>
        {loading ? (
          <Loader />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Student</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
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
                  orders.map((order) => {
                    const id = order.id || order._id || 'ORD';
                    return (
                      <tr key={id}>
                        <td style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-dark)' }}>
                          {id.length > 14 ? `${id.substring(0, 14)}...` : id}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{order.user?.name || 'Student'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user?.email}</div>
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>
                          {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'}
                        </td>
                        <td style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {formatDate(order.createdAt)}
                        </td>
                        <td>
                          {getStatusBadge(order.status || order.paymentStatus)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="btn btn-sm btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                          >
                            <FiEye /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Order Details</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  ID: {selectedOrder.id || selectedOrder._id}
                </span>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                <FiX />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-muted)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Customer</div>
                <div style={{ fontWeight: 600 }}>{selectedOrder.user?.name || 'Student'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedOrder.user?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Order Status</div>
                {getStatusBadge(selectedOrder.status || selectedOrder.paymentStatus)}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Created Date</div>
                <div style={{ fontSize: '0.875rem' }}>{formatDate(selectedOrder.createdAt)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Total Amount</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-dark)' }}>{formatPrice(selectedOrder.totalAmount)}</div>
              </div>
            </div>

            {/* Line Items */}
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Purchased Items</h3>
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              {(selectedOrder.items || []).map((item, idx) => (
                <div
                  key={item.id || item._id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    borderBottom: idx === (selectedOrder.items?.length || 0) - 1 ? 'none' : '1px solid var(--border-subtle)',
                  }}
                >
                  <div>
                    <span className="badge badge-primary" style={{ marginRight: '8px', fontSize: '0.75rem' }}>
                      {item.itemType || 'course'}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</span>
                  </div>
                  <div style={{ fontWeight: 700 }}>{formatPrice(item.price)}</div>
                </div>
              ))}
            </div>

            {/* Gateway Audit Info */}
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Gateway Audit</h3>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', backgroundColor: 'var(--bg-muted)', padding: '0.875rem', borderRadius: '8px', fontFamily: 'monospace' }}>
              <div>Razorpay Order ID: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedOrder.razorpayOrderId || 'N/A (Free/Direct)'}</span></div>
              <div>Razorpay Payment ID: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedOrder.razorpayPaymentId || 'N/A'}</span></div>
              <div>Receipt: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedOrder.receipt || 'N/A'}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
