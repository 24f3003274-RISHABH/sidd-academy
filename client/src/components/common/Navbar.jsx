import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiBook,
  FiGrid,
  FiShoppingBag,
  FiAward,
  FiLayers,
  FiSettings,
  FiFileText,
} from 'react-icons/fi';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = (user?.role || '').toLowerCase() === 'admin';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const navLinkStyle = ({ isActive }) => ({
    color: isActive ? 'var(--primary)' : undefined,
    fontWeight: isActive ? 700 : undefined,
  });

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container flex-between" style={{ width: '100%', gap: '1rem' }}>
        <Link to="/" className="navbar-brand">
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <FiAward size={20} />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>SIDD</span>{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>ACADEMY</span>
          </div>
        </Link>

        <div className="navbar-links hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flexWrap: 'wrap' }}>
          <NavLink to="/" end className="navbar-link" style={navLinkStyle}>
            Home
          </NavLink>
          <NavLink to="/courses" className="navbar-link" style={navLinkStyle}>
            Courses
          </NavLink>
          <NavLink to="/notes" className="navbar-link" style={navLinkStyle}>
            Notes & PDFs
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/student/dashboard" className="navbar-link" style={navLinkStyle}>
                My Dashboard
              </NavLink>
              <NavLink to="/student/my-courses" className="navbar-link" style={navLinkStyle}>
                My Courses
              </NavLink>
              <NavLink to="/student/notes" className="navbar-link" style={navLinkStyle}>
                My Notes
              </NavLink>
            </>
          )}
          <NavLink to="/about" className="navbar-link" style={navLinkStyle}>
            About
          </NavLink>
          <NavLink to="/contact" className="navbar-link" style={navLinkStyle}>
            Contact
          </NavLink>
        </div>

        <div className="hidden-mobile" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="btn btn-sm btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    padding: '0.45rem 0.85rem',
                  }}
                >
                  <FiSettings size={14} /> Admin Panel
                </Link>
              )}

              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '30px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-card)',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user?.name || 'Account'}
                  </span>
                </button>
                {dropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      backgroundColor: 'var(--bg-card)',
                      padding: '0.5rem',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-lg)',
                      border: '1px solid var(--border)',
                      width: '230px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      zIndex: 100,
                    }}
                  >
                    <div
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {user?.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                    </div>
                    {isAdmin && (
                      <>
                        <Link to="/admin/dashboard" className="navbar-link" onClick={() => setDropdownOpen(false)}>
                          <FiGrid /> Admin Dashboard
                        </Link>
                        <Link to="/admin/courses" className="navbar-link" onClick={() => setDropdownOpen(false)}>
                          <FiBook /> Manage Courses & Playlists
                        </Link>
                        <Link to="/admin/curriculum" className="navbar-link" onClick={() => setDropdownOpen(false)}>
                          <FiLayers /> Curriculum Studio
                        </Link>
                        <Link to="/admin/notes" className="navbar-link" onClick={() => setDropdownOpen(false)}>
                          <FiFileText /> Manage Study Notes
                        </Link>
                      </>
                    )}
                    <Link to="/student/dashboard" className="navbar-link" onClick={() => setDropdownOpen(false)}>
                      <FiGrid /> Student Dashboard
                    </Link>
                    <Link to="/student/my-courses" className="navbar-link" onClick={() => setDropdownOpen(false)}>
                      <FiBook /> My Courses
                    </Link>
                    <Link to="/student/notes" className="navbar-link" onClick={() => setDropdownOpen(false)}>
                      <FiFileText /> My Notes
                    </Link>
                    <Link to="/student/orders" className="navbar-link" onClick={() => setDropdownOpen(false)}>
                      <FiShoppingBag /> My Orders
                    </Link>
                    <Link to="/student/profile" className="navbar-link" onClick={() => setDropdownOpen(false)}>
                      <FiUser /> Profile
                    </Link>
                    <div
                      style={{
                        borderTop: '1px solid var(--border-subtle)',
                        marginTop: '0.25rem',
                        paddingTop: '0.25rem',
                      }}
                    >
                      <button
                        onClick={handleLogout}
                        className="btn btn-danger btn-sm"
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <FiLogOut /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>

        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.25rem',
          }}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            backgroundColor: 'var(--bg-card)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            borderBottom: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <Link to="/" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/courses" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Courses
          </Link>
          <Link to="/notes" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Notes & PDFs
          </Link>
          <Link to="/about" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            About
          </Link>
          <Link to="/contact" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Contact
          </Link>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {isAdmin && (
                  <>
                    <Link to="/admin/dashboard" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                      <FiGrid /> Admin Dashboard
                    </Link>
                    <Link to="/admin/courses" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                      <FiBook /> Manage Courses & Playlists
                    </Link>
                    <Link to="/admin/curriculum" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                      <FiLayers /> Curriculum Studio
                    </Link>
                  </>
                )}
                <Link to="/student/dashboard" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                  <FiGrid /> Student Dashboard
                </Link>
                <Link to="/student/my-courses" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                  <FiBook /> My Courses
                </Link>
                <Link to="/student/notes" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                  <FiFileText /> My Notes
                </Link>
                <Link to="/student/orders" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                  <FiShoppingBag /> My Orders
                </Link>
                <Link to="/student/profile" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                  <FiUser /> My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-danger btn-sm"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link
                  to="/login"
                  className="btn btn-outline"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
