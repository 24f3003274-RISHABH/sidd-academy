import React from 'react';
import StudentSidebar from './StudentSidebar';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiBook, FiFileText, FiShoppingBag, FiUser } from 'react-icons/fi';

const StudentLayout = ({ children, title, subtitle, actions }) => {
  return (
    <div className="container" style={{ padding: '2rem 1rem 4rem 1rem', maxWidth: '1360px' }}>
      {/* Optional Page Header */}
      {(title || actions) && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div>
            {title && <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800 }}>{title}</h1>}
            {subtitle && (
              <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>{actions}</div>}
        </div>
      )}

      {/* Main Layout Grid */}
      <div
        className="student-layout-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 260px) 1fr',
          gap: '2rem',
          alignItems: 'start',
        }}
      >
        {/* Desktop Sidebar */}
        <div className="student-desktop-sidebar">
          <StudentSidebar />
        </div>

        {/* Mobile Horizontal Quick Tabs (visible on mobile screens) */}
        <div className="student-mobile-tabs" style={{ display: 'none', gridColumn: '1 / -1', marginBottom: '1rem' }}>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.5rem',
              scrollbarWidth: 'none',
            }}
          >
            <NavLink
              to="/student/dashboard"
              className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <FiGrid /> Dashboard
            </NavLink>
            <NavLink
              to="/student/my-courses"
              className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <FiBook /> Courses
            </NavLink>
            <NavLink
              to="/student/notes"
              className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <FiFileText /> Notes
            </NavLink>
            <NavLink
              to="/student/orders"
              className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <FiShoppingBag /> Orders
            </NavLink>
            <NavLink
              to="/student/profile"
              className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
              style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <FiUser /> Profile
            </NavLink>
          </div>
        </div>

        {/* Main Content Area */}
        <main style={{ minWidth: 0, width: '100%' }}>{children}</main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .student-layout-container {
            grid-template-columns: 1fr !important;
          }
          .student-desktop-sidebar {
            display: none !important;
          }
          .student-mobile-tabs {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentLayout;
