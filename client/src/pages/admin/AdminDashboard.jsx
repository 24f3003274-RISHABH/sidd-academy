import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats, getAllOrders } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import { formatPrice, formatDate } from '../../utils/helpers';
import { FiUsers, FiDollarSign, FiBook, FiFileText, FiVideo, FiImage, FiArrowRight, FiShield, FiCheckCircle, FiClock, FiLayers } from 'react-icons/fi';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalNotes: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.allSettled([
          getDashboardStats(),
          getAllOrders({ limit: 5 })
        ]);
        
        if (!isMounted) return;

        if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
          const raw = statsRes.value.data.data || statsRes.value.data;
          setStats({
            totalUsers: raw.totalUsers ?? 0,
            totalCourses: raw.totalCourses ?? 0,
            totalNotes: raw.totalNotes ?? 0,
            totalOrders: raw.totalOrders ?? 0,
            totalRevenue: raw.totalRevenue ?? 0,
          });
          if (Array.isArray(raw.recentOrders) && raw.recentOrders.length > 0) {
            setRecentOrders(raw.recentOrders);
          }
        }

        if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
          const rawOrders = ordersRes.value.data.data || ordersRes.value.data;
          const orderList = Array.isArray(rawOrders) ? rawOrders : (rawOrders.orders || []);
          if (orderList.length > 0) {
            setRecentOrders(orderList);
          }
        }
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <Loader fullPage />;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
            <FiShield /> SIDD ACADEMY • ADMIN CONTROL PANEL
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Overview & Management
          </h1>
        </div>
        <Link to="/" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          View Live Website <FiArrowRight />
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Students</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiUsers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {stats.totalUsers}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Registered student accounts</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Revenue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiDollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-dark)' }}>
            {formatPrice(stats.totalRevenue)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Completed paid transactions</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Published Courses</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--secondary-subtle)', color: 'var(--secondary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiBook size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {stats.totalCourses}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Classes & subject modules</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Modular Notes & PDFs</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiFileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {stats.totalNotes}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Downloadable study resources</div>
        </div>
      </div>

      {/* Quick Access Modules Hub */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
        Quick Management Modules
      </h2>
      <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
        <Link to="/admin/courses" className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiBook size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Courses</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Manage classes & curricula</div>
          </div>
        </Link>

        <Link to="/admin/videos" className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiVideo size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>YouTube Videos</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Lectures & Playlist links</div>
          </div>
        </Link>

        <Link to="/admin/notes" className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--secondary-subtle)', color: 'var(--secondary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiFileText size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>PDF Notes</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Modular study PDFs</div>
          </div>
        </Link>

        <Link to="/admin/banners" className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '8px', backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiImage size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Home Banners</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Sliders & promotions</div>
          </div>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Recent Student Orders</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Latest enrollments and material purchases</p>
          </div>
          <Link to="/admin/orders" className="btn btn-outline btn-sm">View All Orders</Link>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recent orders found in database.
                  </td>
                </tr>
              ) : (
                recentOrders.map(order => {
                  const orderId = order.id || order._id || 'ORD';
                  const userName = order.user?.name || order.userName || 'Student';
                  const userEmail = order.user?.email || order.userEmail || '';
                  const status = (order.status || 'PENDING').toLowerCase();
                  const isPaid = status === 'paid' || status === 'completed';

                  return (
                    <tr key={orderId}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-dark)' }}>
                        {orderId.length > 10 ? `${orderId.substring(0, 10)}...` : orderId}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{userName}</div>
                        {userEmail && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{userEmail}</div>}
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {formatPrice(order.totalAmount || order.amount || 0)}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {formatDate(order.createdAt || new Date())}
                      </td>
                      <td>
                        <span className={`badge ${isPaid ? 'badge-success' : 'badge-primary'}`}>
                          {isPaid ? <FiCheckCircle /> : <FiClock />}
                          {order.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
