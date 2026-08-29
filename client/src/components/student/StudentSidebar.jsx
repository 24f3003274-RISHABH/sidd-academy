import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ConfirmationModal from '../common/ConfirmationModal';
import {
  FiGrid,
  FiBook,
  FiFileText,
  FiShoppingBag,
  FiUser,
  FiLogOut,
  FiCompass,
  FiCheckCircle,
} from 'react-icons/fi';

const StudentSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const handleConfirmLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: <FiGrid size={18} /> },
    { name: 'My Courses', path: '/student/my-courses', icon: <FiBook size={18} /> },
    { name: 'My Notes', path: '/student/notes', icon: <FiFileText size={18} /> },
    { name: 'Purchase History', path: '/student/orders', icon: <FiShoppingBag size={18} /> },
    { name: 'Profile & Settings', path: '/student/profile', icon: <FiUser size={18} /> },
  ];

  return (
    <>
      <aside
        style={{
          width: '260px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* Student Mini Profile Header Card */}
        <div
          className="card-glass"
          style={{
            padding: '1.25rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'rgba(108, 99, 255, 0.2)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (user?.name || 'S').charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.name || 'Student'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
              <FiCheckCircle size={11} /> Verified Student
            </div>
          </div>
        </div>

        {/* Navigation Links Card */}
        <div
          className="card-glass"
          style={{
            padding: '0.75rem',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>
            Learning Portal
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `student-nav-link ${isActive ? 'active' : ''}`}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 0.85rem',
                borderRadius: '10px',
                color: isActive ? '#fff' : 'var(--text-muted)',
                backgroundColor: isActive ? 'rgba(108, 99, 255, 0.2)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              })}
            >
              <span style={{ color: 'var(--accent)' }}>{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}

          <div style={{ margin: '0.5rem 0', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }} />

          <NavLink
            to="/courses"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.7rem 0.85rem',
              borderRadius: '10px',
              color: 'var(--text-muted)',
              fontWeight: 500,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            <span style={{ color: '#f59e0b' }}><FiCompass size={18} /></span>
            <span>Explore All Courses</span>
          </NavLink>

          <button
            onClick={() => setIsLogoutModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.7rem 0.85rem',
              borderRadius: '10px',
              color: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginTop: '0.25rem',
              width: '100%',
              textAlign: 'left',
              transition: 'background-color 0.2s',
            }}
          >
            <FiLogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        title="Sign Out Confirmation"
        message="Are you sure you want to end your current student session? You can sign back in anytime."
        confirmText="Sign Out"
        cancelText="Stay Logged In"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
};

export default StudentSidebar;
