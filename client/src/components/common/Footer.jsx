import React from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiMail, FiPhone, FiMapPin, FiYoutube } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
              <FiAward size={18} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-dark)', margin: 0 }}>Sidd Academy</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '340px', marginBottom: '1.25rem' }}>
            UP Board & NCERT Hindi-Medium विद्यार्थियों के लिए प्रयागराज का सबसे विश्वसनीय ई-लर्निंग प्लेटफॉर्म। आसान भाषा में वीडियो क्लासेस और हस्तलिखित PDF नोट्स।
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem', backgroundColor: 'var(--primary-subtle)', borderRadius: '20px', color: 'var(--primary-dark)', fontSize: '0.8rem', fontWeight: 600 }}>
            <FiYoutube style={{ color: '#ef4444' }} /> YouTube: @A2CCENTRE
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>कक्षाएं (Classes)</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li><Link to="/courses" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Class 10th (High School)</Link></li>
            <li><Link to="/courses" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Class 11th (Science / Arts)</Link></li>
            <li><Link to="/courses" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Class 12th (Board & Entrance)</Link></li>
            <li><Link to="/courses" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>All Online Courses</Link></li>
          </ul>
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>संसाधन (Resources)</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <li><Link to="/notes" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Modular PDF Notes</Link></li>
            <li><Link to="/about" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>About Sidd Academy</Link></li>
            <li><Link to="/contact" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Help & Support</Link></li>
          </ul>
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>संपर्क (Contact)</h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiPhone style={{ color: 'var(--primary)' }} /> +91 8756940318
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiMail style={{ color: 'var(--primary)' }} /> support@siddacademy.com
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <FiMapPin style={{ color: 'var(--primary)', marginTop: '0.2rem' }} /> Rajapur, Prayagraj, Uttar Pradesh, India
            </li>
          </ul>
        </div>
      </div>

      <div className="container" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div>&copy; {new Date().getFullYear()} Sidd Academy. All rights reserved. (PERN Stack)</div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Refund Policy</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
