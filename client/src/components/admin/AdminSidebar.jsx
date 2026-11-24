import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  FiGrid,
  FiBook,
  FiList,
  FiFileText,
  FiUsers,
  FiDollarSign,
  FiImage,
  FiLogOut,
  FiFolder,
  FiVideo,
  FiX,
  FiExternalLink,
  FiLayers,
  FiCalendar,
  FiAward,
} from 'react-icons/fi';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: <FiGrid /> },
    ],
  },
  {
    label: 'Teaching & Content',
    items: [
      { name: 'Courses & Playlists', path: '/admin/courses', icon: <FiBook /> },
      { name: 'Course Studio', path: '/admin/curriculum', icon: <FiFolder /> },
      { name: 'Study Notes (PDF)', path: '/admin/notes', icon: <FiFileText /> },
      { name: 'YouTube Videos', path: '/admin/videos', icon: <FiVideo /> },
    ],
  },
  {
    label: 'Storefront',
    items: [
      { name: 'Banners & Posters', path: '/admin/banners', icon: <FiImage /> },
    ],
  },
  {
    label: 'Students & Sales',
    items: [
      { name: 'Users', path: '/admin/users', icon: <FiUsers /> },
      { name: 'Orders', path: '/admin/orders', icon: <FiDollarSign /> },
    ],
  },
  {
    label: 'Curriculum Lists',
    items: [
      { name: 'Subjects', path: '/admin/subjects', icon: <FiLayers /> },
      { name: 'Chapters', path: '/admin/chapters', icon: <FiList /> },
      { name: 'Daily Classes', path: '/admin/classes', icon: <FiCalendar /> },
    ],
  },
];

const AdminSidebar = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className={`admin-sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="admin-sidebar-brand">
        <Link to="/admin/dashboard" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FiAward size={18} />
          </div>
          <div>
            <span className="admin-kicker" style={{ display: 'block', lineHeight: 1 }}>Sidd Academy</span>
            <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Admin Studio
            </h2>
          </div>
        </Link>
        <button
          type="button"
          className="admin-sidebar-close"
          onClick={onClose}
          aria-label="Close admin navigation"
        >
          <FiX />
        </button>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin sections">
        {NAV_GROUPS.map((group, groupIdx) => (
          <div key={group.label} className={`admin-sidebar-group ${groupIdx > 0 ? 'has-divider' : ''}`}>
            <p className="admin-nav-label">{group.label}</p>
            <ul>
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        {user?.name && (
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.email || 'Administrator'}
              </div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to="/"
            onClick={onClose}
            className="btn btn-outline btn-sm"
            style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem', padding: '0.45rem 0.5rem' }}
          >
            <FiExternalLink size={13} /> Live Site
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--danger)', borderColor: 'rgba(220, 38, 38, 0.25)', padding: '0.45rem 0.65rem', fontSize: '0.78rem' }}
            title="Sign out"
          >
            <FiLogOut size={13} /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
