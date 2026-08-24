import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer" style={{ padding: '4rem 0 2rem 0', backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="container footer-grid grid-4">
        <div className="footer-brand">
          <h2 className="text-gradient" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Sidd Academy</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Learn Smarter. Grow Faster. The ultimate platform for mastering your subjects.</p>
        </div>
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Courses</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><Link to="/courses" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>All Courses</Link></li>
            <li><Link to="/courses" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Free Courses</Link></li>
            <li><Link to="/courses" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Premium Courses</Link></li>
          </ul>
        </div>
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Resources</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><Link to="/notes" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Notes Library</Link></li>
            <li><Link to="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>About Us</Link></li>
            <li><Link to="/contact" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Contact Info</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted)' }}>
            <li>support@siddacademy.com</li>
            <li>+91 8756940318</li>
            <li>Rajapur, Prayagraj, U.P., India</li>
          </ul>
        </div>
      </div>
      <div className="container" style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        &copy; {new Date().getFullYear()} Sidd Academy. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
