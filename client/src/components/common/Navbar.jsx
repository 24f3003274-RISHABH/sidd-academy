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
  FiChevronDown,
  FiDollarSign,
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
      setScrolled(window.scrollY > 12);
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
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand" onClick={() => setMobileMenuOpen(false)}>
          <div className="navbar-brand-icon">
            <FiAward size={19} />
          </div>
          <span className="navbar-brand-text">
            <strong>SIDD</strong> <span>ACADEMY</span>
          </span>
        </Link>

        {/* Desktop Primary Links — strictly single-row, no wrapping */}
        <div className="navbar-links hidden-mobile">
          <NavLink to="/" end className="navbar-link">
            Home
          </NavLink>
          <NavLink to="/courses" className="navbar-link">
            Courses
          </NavLink>
          <NavLink to="/notes" className="navbar-link">
            Notes &amp; PDFs
          </NavLink>
          {isAuthenticated && !isAdmin && (
            <NavLink to="/student/dashboard" className="navbar-link">
              Dashboard
            </NavLink>
          )}
          <NavLink to="/about" className="navbar-link">
            About
          </NavLink>
          <NavLink to="/contact" className="navbar-link">
            Contact
          </NavLink>
        </div>

        {/* Desktop Right Actions */}
        <div className="navbar-actions hidden-mobile">
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link to="/admin/dashboard" className="btn btn-sm btn-primary navbar-admin-btn">
                  <FiSettings size={14} /> Admin Panel
                </Link>
              )}

              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="navbar-user-pill"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                >
                  <div className="navbar-user-avatar">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="navbar-user-name">{user?.name || 'Account'}</span>
                  <FiChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </button>

                {dropdownOpen && (
                  <div className="navbar-dropdown" role="menu">
                    <div className="navbar-dropdown-header">
                      <div className="navbar-dropdown-name">{user?.name}</div>
                      <div className="navbar-dropdown-email">{user?.email}</div>
                    </div>

                    {isAdmin ? (
                      <>
                        <Link to="/admin/dashboard" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiGrid size={15} /> Admin Dashboard
                        </Link>
                        <Link to="/admin/courses" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiBook size={15} /> Manage Courses
                        </Link>
                        <Link to="/admin/curriculum" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiLayers size={15} /> Course Studio
                        </Link>
                        <Link to="/admin/notes" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiFileText size={15} /> Study Notes
                        </Link>
                        <Link to="/admin/orders" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiDollarSign size={15} /> Orders
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link to="/student/dashboard" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiGrid size={15} /> Dashboard
                        </Link>
                        <Link to="/student/my-courses" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiBook size={15} /> My Courses
                        </Link>
                        <Link to="/student/notes" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiFileText size={15} /> My Notes
                        </Link>
                        <Link to="/student/orders" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiShoppingBag size={15} /> Purchase History
                        </Link>
                        <Link to="/student/profile" className="navbar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiUser size={15} /> Profile &amp; Settings
                        </Link>
                      </>
                    )}

                    <div className="navbar-dropdown-footer">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="btn btn-danger btn-sm btn-full"
                      >
                        <FiLogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-drawer">
          <Link to="/" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Home
          </Link>
          <Link to="/courses" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Courses
          </Link>
          <Link to="/notes" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Notes &amp; PDFs
          </Link>
          <Link to="/about" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            About
          </Link>
          <Link to="/contact" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
            Contact
          </Link>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {isAdmin ? (
                  <>
                    <Link to="/admin/dashboard" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                      <FiGrid /> Admin Dashboard
                    </Link>
                    <Link to="/admin/courses" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                      <FiBook /> Manage Courses
                    </Link>
                    <Link to="/admin/curriculum" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                      <FiLayers /> Course Studio
                    </Link>
                    <Link to="/admin/notes" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                      <FiFileText /> Study Notes
                    </Link>
                  </>
                ) : (
                  <>
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
                      <FiShoppingBag /> Purchase History
                    </Link>
                    <Link to="/student/profile" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>
                      <FiUser /> Profile &amp; Settings
                    </Link>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-danger btn-sm btn-full"
                  style={{ marginTop: '0.5rem' }}
                >
                  <FiLogOut /> Sign Out
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
