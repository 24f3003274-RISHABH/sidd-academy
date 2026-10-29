import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { FiMenu, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="admin-main">
        <div className="admin-mobile-bar">
          <button type="button" className="admin-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open admin navigation">
            <FiMenu />
          </button>
          <span className="admin-mobile-title">Sidd Admin</span>
          <Link to="/" className="admin-mobile-site-link" aria-label="View live website">
            <FiExternalLink />
          </Link>
        </div>
        <Outlet />
      </main>
      {sidebarOpen && <button type="button" className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close admin navigation" />}
    </div>
  );
};

export default AdminLayout;
