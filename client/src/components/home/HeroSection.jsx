import React from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiPlayCircle, FiDownloadCloud, FiAward } from 'react-icons/fi';

const HeroSection = () => {
  return (
    <section className="hero-section" style={{ padding: '4rem 0 3rem', position: 'relative' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(108, 99, 255, 0.15)', padding: '0.4rem 1rem', borderRadius: '30px', color: '#939aff', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            <FiAward /> #1 Learning Platform for Class 9 to 12 & Entrance Exams
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.25rem' }}>
            Master Every Subject with <span className="text-gradient">Modular Learning</span> & Video Lectures
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '2rem' }}>
            Structured chapter-wise video classes linked with YouTube, downloadable modular PDF notes (PDF 1, PDF 2), and comprehensive question banks for CBSE & State Boards.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/courses" className="btn btn-primary" style={{ padding: '0.8rem 1.8rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiBook /> Explore Courses
            </Link>
            <Link to="/notes" className="btn btn-outline" style={{ padding: '0.8rem 1.8rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiDownloadCloud /> Modular Notes (PDF)
            </Link>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div 
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'var(--bg-secondary)',
              width: '100%',
              maxWidth: '520px',
            }}
          >
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80" 
              alt="Sidd Academy Learning Hub" 
              style={{ width: '100%', height: '320px', objectFit: 'cover' }}
            />
            <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-around', textAlign: 'center', backgroundColor: '#13141f' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>50+</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Modular Chapters</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}></div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>100+</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>YouTube Lectures</div>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}></div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffb703' }}>10k+</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDF Downloads</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
