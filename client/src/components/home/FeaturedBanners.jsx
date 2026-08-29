import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiZap, FiSettings, FiVolume2, FiLayers } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

const FeaturedBanners = ({ banners = [] }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const activeBanners = banners.filter(b => b.isActive !== false);

  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [activeBanners.length, isPaused]);

  if (!activeBanners || activeBanners.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      handleNext();
    }
    if (touchStartX.current - touchEndX.current < -50) {
      handlePrev();
    }
  };

  const currentBanner = activeBanners[currentIndex];

  return (
    <section 
      style={{ 
        position: 'relative', 
        margin: '1.5rem 0 3rem',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container">
        {/* Floating Top Header / Badge Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#ffb703', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            <FiZap className="animate-pulse" /> Trending Crash Courses & Announcements
          </div>
          {(user?.role || '').toLowerCase() === 'admin' && (
            <Link 
              to="/admin/banners" 
              className="badge badge-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none', padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
              title="Admin: Click to add, edit or remove banners"
            >
              <FiSettings size={12} /> Admin: Manage Banners
            </Link>
          )}
        </div>

        {/* Main Sliding Banner Frame */}
        <div 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            minHeight: '260px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'linear-gradient(135deg, #181926 0%, #0d0e15 100%)',
          }}
        >
          {/* Background Image with Gradient Overlay */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${currentBanner.imageUrl || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80'})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.28) saturate(1.2)',
              transition: 'all 0.6s ease-in-out',
            }}
          />

          {/* Floating Subtle Ambient Glow */}
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(108, 99, 255, 0.35) 0%, transparent 60%), linear-gradient(90deg, rgba(10,11,18,0.95) 0%, rgba(10,11,18,0.65) 55%, rgba(10,11,18,0.2) 100%)',
              zIndex: 1,
            }}
          />

          {/* Banner Content Container */}
          <div 
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '2.5rem 3rem',
              maxWidth: '680px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: '260px',
            }}
          >
            {/* Custom Tag/Badge */}
            <div style={{ marginBottom: '0.85rem' }}>
              <span 
                style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #ff4d6d 0%, #6c63ff 100%)',
                  color: '#fff',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  boxShadow: '0 4px 12px rgba(255, 77, 109, 0.35)',
                }}
              >
                {currentBanner.badge || '🔥 FEATURED ANNOUNCEMENT'}
              </span>
            </div>

            {/* Banner Title */}
            <h2 
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                fontWeight: 800,
                color: '#ffffff',
                lineHeight: 1.2,
                marginBottom: '0.75rem',
                textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              }}
            >
              {currentBanner.title}
            </h2>

            {/* Subtitle */}
            <p 
              style={{
                color: '#e2e4f0',
                fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)',
                lineHeight: 1.5,
                marginBottom: '1.75rem',
                maxWidth: '560px',
              }}
            >
              {currentBanner.subtitle || 'Explore high-yield structured learning and practice materials.'}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link 
                to={currentBanner.linkUrl || '/courses'}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  boxShadow: '0 8px 20px rgba(108, 99, 255, 0.4)',
                }}
              >
                {currentBanner.buttonText || 'Explore Now'} <FiArrowRight />
              </Link>
              
              <Link
                to="/notes"
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem 1.4rem',
                  fontSize: '0.95rem',
                  borderRadius: '10px',
                }}
              >
                <FiLayers /> Modular Notes
              </Link>
            </div>
          </div>

          {/* Navigation Arrows (Prev / Next) */}
          {activeBanners.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                aria-label="Previous Banner"
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 3,
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(20, 22, 35, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(20, 22, 35, 0.75)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <FiChevronLeft size={22} />
              </button>

              <button
                onClick={handleNext}
                aria-label="Next Banner"
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 3,
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(20, 22, 35, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(20, 22, 35, 0.75)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <FiChevronRight size={22} />
              </button>
            </>
          )}

          {/* Slide Indicator Dots & Counter */}
          {activeBanners.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '1.25rem',
                right: '1.75rem',
                zIndex: 3,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(15, 17, 28, 0.8)',
                padding: '0.4rem 0.8rem',
                borderRadius: '30px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(6px)',
              }}
            >
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  style={{
                    width: idx === currentIndex ? '22px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: idx === currentIndex ? 'var(--primary)' : 'rgba(255, 255, 255, 0.3)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.3rem', fontWeight: 600 }}>
                {currentIndex + 1}/{activeBanners.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBanners;
