import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiUser, FiBook, FiLogOut } from 'react-icons/fi';

const StudentSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { name: 'My Profile', path: '/student/dashboard', icon: <FiUser /> },
    { name: 'My Courses', path: '/student/my-courses', icon: <FiBook /> },
  ];

  return (
    <aside style={{ width: '240px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Student Panel</h3>
      </div>
      <nav>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  backgroundColor: isActive ? 'rgba(108, 99, 255, 0.1)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                {item.icon}
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <FiLogOut /> Logout
        </button>
      </div>
    </aside>
  );
};

export default StudentSidebar;
