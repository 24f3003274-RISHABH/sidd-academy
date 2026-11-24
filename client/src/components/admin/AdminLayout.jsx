import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import {
  FiMenu,
  FiExternalLink,
  FiArrowLeft,
  FiHome,
  FiGrid,
  FiBook,
  FiFolder,
  FiVideo,
  FiFileText,
  FiImage,
  FiUsers,
  FiDollarSign,
  FiLayers,
} from 'react-icons/fi';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const quickLinks = [
    { label: 'Dashboard', to: '/admin/dashboard', icon: <FiGrid size={13} /> },
    { label: 'Courses & Playlists', to: '/admin/courses', icon: <FiBook size={13} /> },
    { label: 'Curriculum Studio', to: '/admin/curriculum', icon: <FiFolder size={13} /> },
    { label: 'Videos', to: '/admin/videos', icon: <FiVideo size={13} /> },
    { label: 'Study Notes', to: '/admin/notes', icon: <FiFileText size={13} /> },
    { label: 'Banners', to: '/admin/banners', icon: <FiImage size={13} /> },
    { label: 'Users', to: '/admin/users', icon: <FiUsers size={13} /> },
    { label: 'Orders', to: '/admin/orders', icon: <FiDollarSign size={13} /> },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="admin-main">
        <div className="admin-mobile-bar">
          <button
            type="button"
            className="admin-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open admin navigation"
          >
            <FiMenu />
          </button>
          <span className="admin-mobile-title">Sidd Admin</span>
          <Link to="/" className="admin-mobile-site-link" aria-label="View live website">
            <FiExternalLink />
          </Link>
        </div>

        {/* Always-Visible Admin Top Navigation Bar (Desktop & Mobile) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            borderRadius: '12px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-sm btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.32rem 0.65rem',
                fontSize: '0.78rem',
              }}
            >
              <FiArrowLeft size={13} /> Back
            </button>
            <Link
              to="/"
              className="btn btn-sm btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.32rem 0.75rem',
                fontSize: '0.78rem',
              }}
            >
              <FiHome size={13} /> Live Website
            </Link>
            <Link
              to="/courses"
              className="btn btn-sm btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.32rem 0.65rem',
                fontSize: '0.78rem',
              }}
            >
              <FiBook size={13} /> Public Catalog
            </Link>
            <Link
              to="/student/dashboard"
              className="btn btn-sm btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.32rem 0.65rem',
                fontSize: '0.78rem',
              }}
            >
              <FiLayers size={13} /> Student Portal
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {quickLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.3rem 0.62rem',
                  fontSize: '0.76rem',
                }}
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <Outlet />
      </main>
      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close admin navigation"
        />
      )}
    </div>
  );
};

export default AdminLayout;
