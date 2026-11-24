import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboardStats } from '../../api/adminApi';
import { SkeletonDashboard } from '../../components/common/SkeletonLoader';
import toast from 'react-hot-toast';
import { formatPrice, formatDate } from '../../utils/helpers';
import {
  FiUsers,
  FiDollarSign,
  FiBook,
  FiFileText,
  FiVideo,
  FiImage,
  FiArrowRight,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiXCircle,
  FiFolder,
  FiRefreshCw,
  FiPlus,
  FiYoutube,
  FiUpload,
} from 'react-icons/fi';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalNotes: 0,
    publishedNotes: 0,
    draftNotes: 0,
    activeBanners: 0,
    totalBanners: 0,
    totalOrders: 0,
    totalRevenue: 0,
    orderBreakdown: { totalOrders: 0, paid: 0, pending: 0, failed: 0, cancelled: 0 },
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);

    try {
      const res = await getDashboardStats();
      const raw = res.data?.data || res.data || {};
      const breakdown = raw.orderBreakdown || {
        totalOrders: raw.totalOrders ?? 0,
        paid: raw.totalOrders ?? 0,
        pending: 0,
        failed: 0,
        cancelled: 0,
      };

      setStats({
        totalUsers: raw.totalUsers ?? 0,
        totalStudents: raw.totalStudents ?? raw.totalUsers ?? 0,
        totalCourses: raw.totalCourses ?? 0,
        publishedCourses: raw.publishedCourses ?? raw.totalCourses ?? 0,
        draftCourses: raw.draftCourses ?? 0,
        totalNotes: raw.totalNotes ?? 0,
        publishedNotes: raw.publishedNotes ?? raw.totalNotes ?? 0,
        draftNotes: raw.draftNotes ?? 0,
        activeBanners: raw.activeBanners ?? 0,
        totalBanners: raw.totalBanners ?? 0,
        totalOrders: raw.totalOrders ?? breakdown.paid ?? 0,
        totalRevenue: raw.totalRevenue ?? 0,
        orderBreakdown: breakdown,
      });
      setRecentOrders(Array.isArray(raw.recentOrders) ? raw.recentOrders : []);
      setRecentUsers(Array.isArray(raw.recentUsers) ? raw.recentUsers : []);
      if (isManualRefresh) toast.success('Dashboard refreshed');
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
      setError(true);
      toast.error('Could not load the admin overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);
  }, []);

  if (loading) return <SkeletonDashboard />;

  if (error) {
    return (
      <div className="card-glass admin-error-state">
        <FiShield size={36} />
        <h2>Admin overview is unavailable</h2>
        <p>Check the connection and try loading the dashboard again.</p>
        <button type="button" className="btn btn-primary" onClick={() => fetchDashboardData(false)}>
          <FiRefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const { orderBreakdown } = stats;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '1.35rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <span className="admin-kicker" style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <FiShield size={12} /> Teacher Control Room
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0 0.25rem' }}>
            Academy Overview
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Track students, payments, published courses, cloud PDFs, and home banners from one control room.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            className="btn btn-outline btn-sm"
            disabled={refreshing}
            title="Refresh live metrics"
          >
            <FiRefreshCw size={13} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link to="/admin/curriculum" className="btn btn-primary btn-sm">
            <FiFolder size={14} /> Open Course Studio <FiArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* 1-Click Quick Actions Strip */}
      <div className="admin-quick-strip">
        <Link to="/admin/courses?action=new" className="btn btn-outline btn-sm" style={{ background: 'var(--bg-card)' }}>
          <FiPlus size={14} /> New Course
        </Link>
        <Link
          to="/admin/courses?action=playlist"
          className="btn btn-outline btn-sm"
          style={{ background: 'var(--bg-card)', color: '#dc2626', borderColor: 'rgba(220,38,38,0.32)' }}
        >
          <FiYoutube size={14} /> Import YouTube Playlist
        </Link>
        <Link to="/admin/notes?action=new" className="btn btn-outline btn-sm" style={{ background: 'var(--bg-card)' }}>
          <FiUpload size={14} /> Upload Study PDF
        </Link>
        <Link to="/admin/banners?action=new" className="btn btn-outline btn-sm" style={{ background: 'var(--bg-card)' }}>
          <FiImage size={14} /> Add Home Banner
        </Link>
        <Link to="/admin/videos" className="btn btn-outline btn-sm" style={{ background: 'var(--bg-card)' }}>
          <FiVideo size={14} /> Manage Videos
        </Link>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
        <Link to="/admin/users" className="stat-card admin-stat-link">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>Registered Students</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiUsers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {stats.totalStudents}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {stats.totalUsers} total account{stats.totalUsers === 1 ? '' : 's'} →
          </div>
        </Link>

        <Link to="/admin/orders?status=PAID" className="stat-card admin-stat-link">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>Paid Revenue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiDollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-dark)', lineHeight: 1.1 }}>
            {formatPrice(stats.totalRevenue)}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {stats.totalOrders} completed order{stats.totalOrders === 1 ? '' : 's'} →
          </div>
        </Link>

        <Link to="/admin/courses" className="stat-card admin-stat-link">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>Courses Catalog</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', backgroundColor: 'var(--secondary-subtle)', color: 'var(--secondary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiBook size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {stats.totalCourses}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {stats.publishedCourses} live{stats.draftCourses > 0 ? ` · ${stats.draftCourses} draft` : ''} →
          </div>
        </Link>

        <Link to="/admin/notes" className="stat-card admin-stat-link">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>Study Notes &amp; PDFs</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiFileText size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
            {stats.totalNotes}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            {stats.publishedNotes} live{stats.draftNotes > 0 ? ` · ${stats.draftNotes} draft` : ''} →
          </div>
        </Link>
      </div>

      {/* Payment & Order Health Strip */}
      <div className="admin-health-strip">
        <Link to="/admin/orders?status=PAID" className="admin-health-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <FiCheckCircle size={16} style={{ color: 'var(--accent-dark)' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Paid Orders</span>
          </div>
          <strong style={{ fontSize: '1.05rem', color: 'var(--accent-dark)' }}>{orderBreakdown.paid}</strong>
        </Link>

        <Link to="/admin/orders?status=PENDING" className="admin-health-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <FiClock size={16} style={{ color: 'var(--secondary-dark)' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Pending</span>
          </div>
          <strong style={{ fontSize: '1.05rem', color: 'var(--secondary-dark)' }}>{orderBreakdown.pending}</strong>
        </Link>

        <Link to="/admin/orders?status=FAILED" className="admin-health-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <FiAlertCircle size={16} style={{ color: '#dc2626' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Failed</span>
          </div>
          <strong style={{ fontSize: '1.05rem', color: orderBreakdown.failed > 0 ? '#dc2626' : 'var(--text-primary)' }}>
            {orderBreakdown.failed}
          </strong>
        </Link>

        <Link to="/admin/orders?status=CANCELLED" className="admin-health-pill">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <FiXCircle size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Cancelled</span>
          </div>
          <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{orderBreakdown.cancelled}</strong>
        </Link>
      </div>

      {/* Main Split: Recent Orders (Left) + Recent Signups & Storefront Status (Right) */}
      <div className="admin-dashboard-split">
        {/* Recent Student Orders */}
        <div className="card" style={{ padding: '1.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.08rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Recent Student Orders</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Latest course enrollments, PDF purchases, and Razorpay checkout updates
              </p>
            </div>
            <Link to="/admin/orders" className="btn btn-outline btn-sm">
              All Orders <FiArrowRight size={13} />
            </Link>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '2.5rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No student orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => {
                    const orderId = order.id || order._id || 'ORD';
                    const userName = order.user?.name || order.userName || 'Student';
                    const userEmail = order.user?.email || order.userEmail || '';
                    const status = (order.status || order.paymentStatus || 'PENDING').toUpperCase();
                    const isPaid = status === 'PAID' || status === 'COMPLETED' || status === 'SUCCESS';
                    const isFailed = status === 'FAILED';
                    const isCancelled = status === 'CANCELLED';
                    const itemNames = (order.items || []).map((i) => i.title).filter(Boolean).join(', ');

                    return (
                      <tr key={orderId}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{userName}</div>
                          {userEmail && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{userEmail}</div>}
                        </td>
                        <td>
                          <div
                            style={{ fontSize: '0.84rem', fontWeight: 500, maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            title={itemNames}
                          >
                            {itemNames || `${order.items?.length || 0} item(s)`}
                          </div>
                          {order.failureReason ? (
                            <div
                              style={{ fontSize: '0.72rem', color: '#dc2626', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              title={order.failureReason}
                            >
                              {order.failureReason}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                              #{orderId.substring(0, 8)}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: '0.88rem' }}>
                          {formatPrice(order.totalAmount || order.amount || 0)}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDate(order.createdAt || new Date())}
                        </td>
                        <td>
                          <span className={`badge ${isPaid ? 'badge-success' : isFailed ? 'badge-danger' : isCancelled ? 'badge-outline' : 'badge-secondary'}`}>
                            {isPaid ? <FiCheckCircle size={11} /> : isFailed ? <FiAlertCircle size={11} /> : isCancelled ? <FiXCircle size={11} /> : <FiClock size={11} />}
                            {isPaid ? 'Paid' : isFailed ? 'Failed' : isCancelled ? 'Cancelled' : 'Pending'}
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

        {/* Right Column: Recent Student Signups + Storefront Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Recent Students</h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                  Newest registered student accounts
                </p>
              </div>
              <Link to="/admin/users" className="btn btn-outline btn-sm" style={{ fontSize: '0.78rem' }}>
                All Users
              </Link>
            </div>

            {recentUsers.length === 0 ? (
              <p style={{ margin: '1.5rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                No student registrations yet.
              </p>
            ) : (
              <div>
                {recentUsers.map((student) => {
                  const sId = student.id || student._id;
                  const initial = (student.name || student.email || 'S').trim().charAt(0).toUpperCase();
                  const isActive = student.isActive !== false && student.is_active !== false;
                  return (
                    <div key={sId} className="admin-user-row">
                      <span className="admin-user-avatar">{initial}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {student.name || 'Student'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {student.email}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem' }}>
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {formatDate(student.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Storefront Banners Card */}
          <div className="card" style={{ padding: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiImage size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--text-primary)' }}>Home Page Banners</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {stats.activeBanners} active of {stats.totalBanners} poster{stats.totalBanners === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              <Link to="/admin/banners" className="btn btn-outline btn-sm" style={{ fontSize: '0.78rem' }}>
                Manage
              </Link>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Keep batch posters, weekend test announcements, and target-batch sliders up to date on the public home page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
