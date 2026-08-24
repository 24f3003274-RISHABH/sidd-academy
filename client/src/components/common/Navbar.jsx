import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiMenu, FiX, FiUser, FiLogOut, FiBook, FiGrid } from 'react-icons/fi';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container flex-between">
        <Link to="/" className="navbar-brand text-gradient">Sidd Academy</Link>
        
        <div className="navbar-links hidden-mobile">
          <Link to="/" className="navbar-link">Home</Link>
          <Link to="/courses" className="navbar-link">Courses</Link>
          <Link to="/notes" className="navbar-link">Notes</Link>
          <Link to="/about" className="navbar-link">About</Link>
          <Link to="/contact" className="navbar-link">Contact</Link>
        </div>

        <div className="hidden-mobile" style={{ position: 'relative' }}>
          {isAuthenticated ? (
            <div onClick={() => setDropdownOpen(!dropdownOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              {dropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', width: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 100 }}>
                  {user?.role === 'admin' && (
                    <Link to="/admin/dashboard" className="navbar-link" onClick={() => setDropdownOpen(false)}><FiGrid /> Admin Dashboard</Link>
                  )}
                  <Link to="/student/dashboard" className="navbar-link" onClick={() => setDropdownOpen(false)}><FiUser /> Dashboard</Link>
                  <Link to="/student/my-courses" className="navbar-link" onClick={() => setDropdownOpen(false)}><FiBook /> My Courses</Link>
                  <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><FiLogOut /> Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
            </div>
          )}
        </div>

        <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', cursor: 'pointer' }} aria-label="Toggle menu">
          {mobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: 'var(--bg-secondary)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Link to="/" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link to="/courses" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Courses</Link>
          <Link to="/notes" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Notes</Link>
          <Link to="/about" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link to="/contact" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
          {isAuthenticated ? (
            <>
              {user?.role === 'admin' && <Link to="/admin/dashboard" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>}
              <Link to="/student/dashboard" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link to="/student/my-courses" className="navbar-link" onClick={() => setMobileMenuOpen(false)}>My Courses</Link>
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn btn-danger" style={{ width: '100%' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" onClick={() => setMobileMenuOpen(false)} style={{ textAlign: 'center' }}>Login</Link>
              <Link to="/register" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)} style={{ textAlign: 'center' }}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
