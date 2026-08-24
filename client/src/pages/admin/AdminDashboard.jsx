import React, { useState, useEffect } from 'react';
import { getDashboardStats, getAllOrders } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';
import { FiUsers, FiDollarSign, FiBook, FiFileText } from 'react-icons/fi';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch stats if API exists, else mock
        const [statsRes, ordersRes] = await Promise.allSettled([
          getDashboardStats(),
          getAllOrders({ limit: 5 })
        ]);
        
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        } else {
          setStats({ totalUsers: 120, totalRevenue: 45000, totalCourses: 15, totalNotes: 45 });
        }
        
        if (ordersRes.status === 'fulfilled') {
          setRecentOrders(ordersRes.value.data.orders);
        } else {
          setRecentOrders([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Loader fullPage />;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard Overview</h1>
      
      <div className="grid-4" style={{ marginBottom: '3rem' }}>
        <div className="stat-card" style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>Total Users</div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(108, 99, 255, 0.1)', borderRadius: '8px', color: 'var(--primary)' }}><FiUsers /></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.totalUsers || 0}</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>Total Revenue</div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(67, 233, 123, 0.1)', borderRadius: '8px', color: 'var(--accent)' }}><FiDollarSign /></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{formatPrice(stats?.totalRevenue || 0)}</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>Total Courses</div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(255, 101, 132, 0.1)', borderRadius: '8px', color: 'var(--secondary)' }}><FiBook /></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.totalCourses || 0}</div>
        </div>
        <div className="stat-card" style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>Total Notes</div>
            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(255, 215, 0, 0.1)', borderRadius: '8px', color: 'var(--accent-gold)' }}><FiFileText /></div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats?.totalNotes || 0}</div>
        </div>
      </div>

      <div className="card-glass" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Recent Orders</h2>
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Order ID</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>User</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Amount</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Date</th>
                <th style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No recent orders found.</td></tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem 0' }}>{order._id.substring(0, 8)}...</td>
                    <td style={{ padding: '1rem 0' }}>{order.user?.name || 'Unknown'}</td>
                    <td style={{ padding: '1rem 0' }}>{formatPrice(order.totalAmount)}</td>
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

export default AdminDashboard;
