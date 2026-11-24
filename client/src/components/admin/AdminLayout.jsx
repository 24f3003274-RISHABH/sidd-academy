import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { FiMenu, FiExternalLink, FiFolder } from 'react-icons/fi';

const SECTION_LABELS = {
  '/admin': 'Dashboard',
  '/admin/dashboard': 'Dashboard',
  '/admin/courses': 'Courses & Playlists',
  '/admin/curriculum': 'Course Studio',
  '/admin/subjects': 'Subjects',
  '/admin/chapters': 'Chapters',
  '/admin/classes': 'Daily Classes',
  '/admin/videos': 'YouTube Videos',
  '/admin/notes': 'Study Notes (PDF)',
  '/admin/banners': 'Banners & Posters',
  '/admin/users': 'Users',
  '/admin/orders': 'Orders',
};

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentSection = SECTION_LABELS[location.pathname] || 'Admin Studio';
  const isCurriculum = location.pathname === '/admin/curriculum';

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="admin-main">
        {/* Single unified slim utility bar (serves both mobile menu toggle & desktop breadcrumb without feeling like a second navbar) */}
        <header className="admin-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
            <button
              type="button"
              className="admin-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open admin navigation"
            >
              <FiMenu size={18} />
            </button>
            <nav aria-label="Admin breadcrumb" className="admin-breadcrumb">
              <Link to="/admin/dashboard" className="admin-breadcrumb-root">Admin</Link>
              <span aria-hidden="true">/</span>
              <strong>{currentSection}</strong>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {!isCurriculum && (
              <Link
                to="/admin/curriculum"
                className="btn btn-sm btn-outline admin-header-studio-btn"
                style={{ fontSize: '0.78rem', padding: '0.32rem 0.7rem' }}
              >
                <FiFolder size={13} /> Course Studio
              </Link>
            )}
            <Link
              to="/"
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.78rem', padding: '0.32rem 0.7rem' }}
              title="Open public website"
            >
              <FiExternalLink size={13} /> <span className="admin-header-site-label">View Website</span>
            </Link>
          </div>
        </header>

        <div className="admin-content-body">
          <Outlet />
        </div>
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
