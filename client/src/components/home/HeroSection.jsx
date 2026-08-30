import React from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiDownloadCloud, FiAward, FiCheckCircle, FiPlayCircle, FiShield } from 'react-icons/fi';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-subtle)', border: '1px solid var(--primary-border)', padding: '0.4rem 1rem', borderRadius: '30px', color: 'var(--primary-dark)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            <FiAward /> प्रयागराज का अग्रणी संस्थान • UP Board & NCERT
          </div>
          
          <h1 style={{ fontSize: 'clamp(2rem, 3.8vw, 3.25rem)', fontWeight: 800, lineHeight: 1.2, color: 'var(--text-primary)', marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>
            Class 10th – 12th की तैयारी, अब होगी <span style={{ color: 'var(--primary)' }}>आसान और व्यवस्थित</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.75rem', maxWidth: '560px' }}>
            UP Board एवं अन्य State Board के हिंदी माध्यम विद्यार्थियों के लिए विषयवार <strong>YouTube Video Lectures</strong>, <strong>अध्याय-वार हस्तलिखित PDF नोट्स</strong> और संपूर्ण प्रश्न बैंक।
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <Link to="/courses" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiBook /> Explore Courses
            </Link>
            <Link to="/notes" className="btn btn-outline btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiDownloadCloud /> Modular Notes (PDF)
            </Link>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiCheckCircle style={{ color: 'var(--accent)' }} /> 100% NCERT Pattern
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiCheckCircle style={{ color: 'var(--accent)' }} /> Hindi Medium Focus
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiShield style={{ color: 'var(--secondary)' }} /> Expert Faculty (Prayagraj)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div 
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              width: '100%',
              maxWidth: '500px',
            }}
          >
            <div style={{ position: 'relative' }}>
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80" 
                alt="Sidd Academy Hindi Medium Classroom" 
                style={{ width: '100%', height: '280px', objectFit: 'cover' }}
                loading="eager"
              />
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', color: '#ffffff', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FiPlayCircle style={{ color: '#ef4444' }} /> High Quality Video Classes
              </div>
            </div>
            
            <div style={{ padding: '1.25rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center', backgroundColor: '#ffffff', borderTop: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>Class 10–12</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>All Streams</div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--secondary)' }}>500+</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PDF Notes</div>
              </div>
              <div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent)' }}>10k+</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Students</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
