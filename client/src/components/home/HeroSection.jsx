import React from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiDownloadCloud, FiAward, FiCheckCircle, FiPlayCircle, FiShield } from 'react-icons/fi';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="container hero-grid">
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-subtle)', border: '1px solid var(--primary-border)', padding: '0.4rem 0.9rem', borderRadius: '30px', color: 'var(--primary-dark)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '1.1rem', maxWidth: '100%' }}>
            <FiAward style={{ flexShrink: 0 }} /> <span>प्रयागराज का अग्रणी संस्थान • UP Board &amp; NCERT</span>
          </div>
          
          <h1 style={{ fontSize: 'clamp(1.75rem, 4.2vw, 3.2rem)', fontWeight: 800, lineHeight: 1.2, color: 'var(--text-primary)', marginBottom: '1.1rem', letterSpacing: '-0.02em' }}>
            Class 10th – 12th की तैयारी, अब होगी <span style={{ color: 'var(--primary)' }}>आसान और व्यवस्थित</span>
          </h1>

          <p style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: '560px' }}>
            UP Board एवं अन्य State Board के हिंदी माध्यम विद्यार्थियों के लिए विषयवार <strong>YouTube Video Lectures</strong>, <strong>अध्याय-वार हस्तलिखित PDF नोट्स</strong> और संपूर्ण प्रश्न बैंक।
          </p>

          <div className="hero-cta-row">
            <Link to="/courses" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiBook /> Explore Courses
            </Link>
            <Link to="/notes" className="btn btn-outline btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiDownloadCloud /> Modular Notes (PDF)
            </Link>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiCheckCircle style={{ color: 'var(--accent)', flexShrink: 0 }} /> 100% NCERT Pattern
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiCheckCircle style={{ color: 'var(--accent)', flexShrink: 0 }} /> Hindi Medium Focus
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiShield style={{ color: 'var(--secondary)', flexShrink: 0 }} /> Expert Faculty (Prayagraj)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', minWidth: 0 }}>
          <div 
            style={{
              borderRadius: '18px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border)',
              backgroundColor: '#0b0e1a',
              width: '100%',
              maxWidth: '600px',
            }}
          >
            <div style={{ position: 'relative', backgroundColor: '#0b0e1a' }}>
              <img 
                src="/posters/sid-academy-faculty-team.jpg" 
                alt="SID Academy Prayagraj Expert Faculty Team — Shahzad Sir, Siddhant Bhaiya & Aakash Sir" 
                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }}
                loading="eager"
              />
            </div>
            
            <div className="hero-stats-strip">
              <div>
                <div className="hero-stat-num" style={{ color: 'var(--primary)' }}>Class 10–12</div>
                <div className="hero-stat-label">All Streams</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                <div className="hero-stat-num" style={{ color: 'var(--secondary)' }}>500+</div>
                <div className="hero-stat-label">PDF Notes</div>
              </div>
              <div>
                <div className="hero-stat-num" style={{ color: 'var(--accent)' }}>10k+</div>
                <div className="hero-stat-label">Students</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
