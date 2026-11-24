import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllOrders } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiSearch,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiXCircle,
  FiEye,
  FiX,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

const VALID_STATUSES = ['ALL', 'PAID', 'PENDING', 'FAILED', 'CANCELLED'];

const ManageOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = (() => {
    const raw = (searchParams.get('status') || 'ALL').toUpperCase();
    return VALID_STATUSES.includes(raw) ? raw : 'ALL';
  })();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searching, setSearching] = useState(false);

  const fetchOrders = async (overrideStatus = statusFilter, overrideSearch = searchQuery, overridePage = page) => {
    setLoading(true);
    setError(false);
    try {
      const params = { limit: 25, page: overridePage };
      if (overrideStatus !== 'ALL') params.status = overrideStatus;
      if (overrideSearch.trim()) params.search = overrideSearch.trim();

      const res = await getAllOrders(params);
      const data = res.data?.data || res.data || {};
      const list = data.orders || (Array.isArray(data) ? data : []);
      setOrders(list);
      setPagination({
        total: data.total ?? list.length,
        totalPages: data.pages ?? data.totalPages ?? 1,
      });
    } catch (err) {
      console.error('Failed to fetch orders', err);
      setError(true);
      toast.error(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const paramStatus = (searchParams.get('status') || 'ALL').toUpperCase();
    const normalized = VALID_STATUSES.includes(paramStatus) ? paramStatus : 'ALL';
    if (normalized !== statusFilter) {
      setStatusFilter(normalized);
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchOrders(statusFilter, searchQuery, page);
  }, [statusFilter, page]);

  const handleStatusChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    setPage(1);
    setSearchParams(nextStatus === 'ALL' ? {} : { status: nextStatus }, { replace: true });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearching(true);
    fetchOrders(statusFilter, searchQuery, 1).finally(() => setSearching(false));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPage(1);
    setSearchParams({}, { replace: true });
    fetchOrders('ALL', '', 1);
  };

  const summary = useMemo(() => {
    let paidRevenue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedOrCancelled = 0;
    orders.forEach((o) => {
      const s = (o.status || o.paymentStatus || '').toUpperCase();
      if (s === 'PAID' || s === 'COMPLETED' || s === 'SUCCESS') {
        paidCount += 1;
        paidRevenue += Number(o.totalAmount || 0);
      } else if (s === 'PENDING' || s === 'CREATED') {
        pendingCount += 1;
      } else {
        failedOrCancelled += 1;
      }
    });
    return { paidRevenue, paidCount, pendingCount, failedOrCancelled };
  }, [orders]);

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID' || s === 'COMPLETED' || s === 'SUCCESS') {
      return (
        <span className="badge badge-success">
          <FiCheckCircle size={12} /> Paid
        </span>
      );
    }
    if (s === 'PENDING' || s === 'CREATED') {
      return (
        <span className="badge badge-secondary">
          <FiClock size={12} /> Pending
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="badge badge-danger">
          <FiAlertCircle size={12} /> Failed
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <span className="badge badge-outline">
          <FiXCircle size={12} /> Cancelled
        </span>
      );
    }
    return <span className="badge badge-outline">{status}</span>;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Orders &amp; Transactions</h1>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Monitor student course enrollments, digital note purchases, and Razorpay payment statuses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchOrders(statusFilter, searchQuery)}
          className="btn btn-outline btn-sm"
          disabled={loading}
        >
          <FiRefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Quick Order Summary Strip */}
      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Paid Revenue (Shown)</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--accent-dark)', marginTop: '0.25rem' }}>
            {formatPrice(summary.paidRevenue)}
          </div>
        </div>
        <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Paid Orders</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {summary.paidCount}
          </div>
        </div>
        <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pending Checkout</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--secondary-dark)', marginTop: '0.25rem' }}>
            {summary.pendingCount}
          </div>
        </div>
        <div className="stat-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Failed / Cancelled</div>
          <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--danger)', marginTop: '0.25rem' }}>
            {summary.failedOrCancelled}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px', position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
            placeholder="Search by Order ID, Razorpay ID, student name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-sm btn-primary" style={{ whiteSpace: 'nowrap' }} disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </button>
          {(searchQuery || statusFilter !== 'ALL') && (
            <button type="button" onClick={handleClearFilters} className="btn btn-sm btn-outline" style={{ whiteSpace: 'nowrap' }}>
              Reset
            </button>
          )}
        </form>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {VALID_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => handleStatusChange(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '999px', padding: '0.32rem 0.8rem', fontSize: '0.78rem' }}
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
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <FiAlertCircle size={32} style={{ color: '#dc2626', marginBottom: '0.5rem' }} />
            <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)' }}>Could not load platform orders.</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => fetchOrders(statusFilter, searchQuery, page)}>
              <FiRefreshCw size={13} /> Retry
            </button>
          </div>
        ) : (
          <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Student</th>
                  <th>Items Purchased</th>
                  <th>Amount</th>
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
                    const itemTitles = (order.items || []).map((i) => i.title).filter(Boolean).join(', ');
                    return (
                      <tr key={id}>
                        <td style={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-dark)' }}>
                          {id.length > 10 ? `${id.substring(0, 10)}…` : id}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{order.user?.name || 'Student'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user?.email}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={itemTitles}>
                            {itemTitles || `${order.items?.length || 0} item(s)`}
                          </div>
                          {order.failureReason && (
                            <div style={{ fontSize: '0.73rem', color: '#dc2626', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.failureReason}>
                              {order.failureReason}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap' }}>
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDate(order.createdAt)}
                        </td>
                        <td>
                          {getStatusBadge(order.status || order.paymentStatus)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="btn btn-sm btn-outline"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}
                          >
                            <FiEye size={13} /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Page {page} of {pagination.totalPages} ({pagination.total} total orders)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <FiChevronLeft /> Prev
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={page >= pagination.totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Order Details</h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  ID: {selectedOrder.id || selectedOrder._id}
                </span>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelectedOrder(null)} aria-label="Close">
                <FiX />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.25rem', padding: '1rem', backgroundColor: 'var(--bg-muted)', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>Student</div>
                <div style={{ fontWeight: 600 }}>{selectedOrder.user?.name || 'Student'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedOrder.user?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>Order Status</div>
                {getStatusBadge(selectedOrder.status || selectedOrder.paymentStatus)}
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>Created Date</div>
                <div style={{ fontSize: '0.85rem' }}>{formatDate(selectedOrder.createdAt)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 700 }}>Total Amount</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-dark)' }}>{formatPrice(selectedOrder.totalAmount)}</div>
              </div>
            </div>

            {selectedOrder.failureReason && (
              <div
                style={{
                  marginBottom: '1.25rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <FiAlertCircle size={16} />
                <div>
                  <strong>Failure Reason:</strong> {selectedOrder.failureReason}
                </div>
              </div>
            )}

            {/* Line Items */}
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.6rem' }}>Purchased Items</h3>
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '1.25rem' }}>
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
                    <span className="badge badge-primary" style={{ marginRight: '8px', fontSize: '0.72rem', textTransform: 'capitalize' }}>
                      {item.itemType || 'course'}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</span>
                  </div>
                  <div style={{ fontWeight: 700 }}>{formatPrice(item.price)}</div>
                </div>
              ))}
            </div>

            {/* Gateway Audit Info */}
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.6rem' }}>Gateway Audit</h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem', backgroundColor: 'var(--bg-muted)', padding: '0.875rem', borderRadius: '8px', fontFamily: 'monospace' }}>
              <div>Razorpay Order ID: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedOrder.razorpayOrderId || 'N/A (Free/Direct)'}</span></div>
              <div>Razorpay Payment ID: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedOrder.razorpayPaymentId || 'N/A'}</span></div>
              <div>Receipt: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedOrder.receipt || 'N/A'}</span></div>
              {selectedOrder.notes && (
                <div>Notes: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedOrder.notes}</span></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
