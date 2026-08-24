import React, { useState, useEffect } from 'react';
import { getAllOrders } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getAllOrders();
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <Loader fullPage />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Manage Orders</h1>
      </div>

      <div className="card-glass" style={{ padding: '1.5rem' }}>
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Order ID</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>User</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Items</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Total</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Date</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No orders found.</td></tr>
              ) : (
                orders.map(order => (
                  <tr key={order._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0', fontSize: '0.9rem' }}>{order._id}</td>
                    <td style={{ padding: '1rem 0' }}>{order.user?.name || order.user?.email || 'Unknown'}</td>
                    <td style={{ padding: '1rem 0' }}>{order.items?.length || 0}</td>
                    <td style={{ padding: '1rem 0', fontWeight: 'bold' }}>{formatPrice(order.totalAmount)}</td>
                    <td style={{ padding: '1rem 0' }}>{formatDate(order.createdAt)}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <span className={`badge ${order.status === 'completed' ? 'badge-success' : 'badge-primary'}`}>{order.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageOrders;
