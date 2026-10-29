import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiGrid, FiBook, FiList, FiFileText, FiUsers, FiDollarSign, FiImage, FiLogOut, FiFolder, FiVideo, FiX } from 'react-icons/fi';

const AdminSidebar = ({ isOpen = false, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <FiGrid /> },
    { name: 'Courses', path: '/admin/courses', icon: <FiBook /> },
    { name: 'Curriculum Builder', path: '/admin/curriculum', icon: <FiFolder /> },
    { name: 'Lesson Videos', path: '/admin/videos', icon: <FiVideo /> },
    { name: 'Study Materials', path: '/admin/notes', icon: <FiFileText /> },
    { name: 'Banners', path: '/admin/banners', icon: <FiImage /> },
    { name: 'Users', path: '/admin/users', icon: <FiUsers /> },
    { name: 'Orders', path: '/admin/orders', icon: <FiDollarSign /> },
  ];

  return (
    <aside className={`admin-sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="admin-sidebar-brand">
        <div>
          <span className="admin-kicker">Control room</span>
          <h2>Sidd Admin</h2>
        </div>
        <button type="button" className="admin-sidebar-close" onClick={onClose} aria-label="Close admin navigation">
          <FiX />
        </button>
      </div>
      <nav className="admin-sidebar-nav">
        <p className="admin-nav-label">Workspace</p>
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                {item.icon}
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="admin-sidebar-footer">
        <button onClick={handleLogout} className="btn btn-outline admin-logout-button">
          <FiLogOut /> Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
