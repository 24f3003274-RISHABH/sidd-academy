import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiGrid, FiBook, FiList, FiFileText, FiUsers, FiDollarSign, FiImage, FiLogOut, FiFolder, FiVideo } from 'react-icons/fi';

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FiGrid /> },
    { name: 'Courses', path: '/admin/courses', icon: <FiBook /> },
    { name: 'Subjects', path: '/admin/subjects', icon: <FiFolder /> },
    { name: 'Chapters', path: '/admin/chapters', icon: <FiList /> },
    { name: 'Video Lectures', path: '/admin/classes', icon: <FiVideo /> },
    { name: 'YouTube Streams', path: '/admin/videos', icon: <FiVideo /> },
    { name: 'Notes & PDFs', path: '/admin/notes', icon: <FiFileText /> },
    { name: 'Banners', path: '/admin/banners', icon: <FiImage /> },
    { name: 'Users', path: '/admin/users', icon: <FiUsers /> },
    { name: 'Orders', path: '/admin/orders', icon: <FiDollarSign /> },
  ];

  return (
    <aside className="admin-sidebar" style={{ width: '250px', backgroundColor: 'var(--bg-secondary)', height: '100vh', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 className="text-gradient">Sidd Admin</h2>
      </div>
      <nav style={{ flex: 1, overflowY: 'auto', padding: '1rem 0' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  backgroundColor: isActive ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
                  borderRight: isActive ? '3px solid var(--primary)' : 'none'
                })}
              >
                {item.icon}
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <FiLogOut /> Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
