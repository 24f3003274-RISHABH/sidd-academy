import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiChevronLeft, FiChevronRight, FiZap, FiSettings, FiLayers, FiPhoneCall } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { resolveMediaUrl } from '../../utils/helpers';

const FeaturedBanners = ({ banners = [] }) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const activeBanners = banners.filter((b) => b.isActive !== false);

  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5500);

    return () => clearInterval(timer);
  }, [activeBanners.length, isPaused]);

  if (!activeBanners || activeBanners.length === 0) return null;

  const safeIndex = currentIndex % activeBanners.length;
  const currentBanner = activeBanners[safeIndex];

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

  return (
    <section
      style={{
        position: 'relative',
        margin: '1.5rem 0 3.5rem',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container">
        {/* Top Header / Badge Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.85rem',
            padding: '0 0.25rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              color: '#ffb703',
              fontWeight: 800,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            <FiZap className="animate-pulse" /> Trending Crash Courses & Official Batch Announcements
          </div>
          {(user?.role || '').toLowerCase() === 'admin' && (
            <Link
              to="/admin/banners"
              className="badge badge-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                textDecoration: 'none',
                padding: '0.3rem 0.75rem',
                fontSize: '0.75rem',
              }}
              title="Admin: Click to add, edit or remove banners"
            >
              <FiSettings size={12} /> Admin: Manage Banners
            </Link>
          )}
        </div>

        {/* Main Announcement Frame — Sized to Show Every Poster in Its Entirety */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            borderRadius: '22px',
            overflow: 'hidden',
            boxShadow: '0 24px 55px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            background: '#0b0e1a',
          }}
        >
          {/* Ambient Blurred Background from Current Poster */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${resolveMediaUrl(currentBanner.imageUrl)})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(26px) brightness(0.25) saturate(1.3)',
              transform: 'scale(1.1)',
              transition: 'all 0.6s ease-in-out',
            }}
          />

          {/* Subtle Dark Gradient Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 20% 50%, rgba(108, 99, 255, 0.25) 0%, transparent 65%), linear-gradient(90deg, rgba(10,11,18,0.88) 0%, rgba(10,11,18,0.6) 50%, rgba(10,11,18,0.35) 100%)',
              zIndex: 1,
            }}
          />

          {/* Main Content Layout: Details on Left + Full Uncropped Poster on Right */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              padding: '2.5rem 3.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              alignItems: 'center',
              gap: '2.5rem',
            }}
          >
            {/* Left Column: Announcement Text & CTAs */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ marginBottom: '1rem' }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #ff4d6d 0%, #6c63ff 100%)',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    padding: '0.4rem 1rem',
                    borderRadius: '20px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                    boxShadow: '0 4px 12px rgba(255, 77, 109, 0.35)',
                  }}
                >
                  {currentBanner.badge || '🔥 FEATURED ANNOUNCEMENT'}
                </span>
              </div>

              <h2
                style={{
                  fontSize: 'clamp(1.6rem, 2.8vw, 2.35rem)',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.25,
                  marginBottom: '0.9rem',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                }}
              >
                {currentBanner.title}
              </h2>

              <p
                style={{
                  color: '#e2e4f0',
                  fontSize: 'clamp(0.95rem, 1.5vw, 1.08rem)',
                  lineHeight: 1.6,
                  marginBottom: '1.75rem',
                }}
              >
                {currentBanner.subtitle || 'Explore high-yield structured learning and practice materials.'}
              </p>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 183, 3, 0.14)',
                  border: '1px solid rgba(255, 183, 3, 0.35)',
                  color: '#ffd166',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  marginBottom: '1.75rem',
                  width: 'fit-content',
                }}
              >
                <FiPhoneCall /> संपर्क: 8756940318, 8452895409 • गली नं. 20 के पास, गंगा नगर, राजापुर, प्रयागराज
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <Link
                  to={currentBanner.linkUrl || '/courses'}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.85rem 1.85rem',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    boxShadow: '0 8px 20px rgba(108, 99, 255, 0.4)',
                  }}
                >
                  {currentBanner.buttonText || 'Explore Now'} <FiArrowRight />
                </Link>

                <Link
                  to="/notes"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.85rem 1.5rem',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.14)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.35)',
                    textDecoration: 'none',
                    backdropFilter: 'blur(8px)',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.24)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)';
                  }}
                >
                  <FiLayers /> Modular Notes
                </Link>
              </div>
            </div>

            {/* Right Column: Full Uncropped Poster Display */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <img
                src={resolveMediaUrl(currentBanner.imageUrl)}
                alt={currentBanner.title}
                style={{
                  width: 'auto',
                  height: 'auto',
                  maxWidth: '100%',
                  maxHeight: '680px',
                  objectFit: 'contain',
                  borderRadius: '14px',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 18px 45px rgba(0, 0, 0, 0.65)',
                  backgroundColor: '#090b12',
                }}
              />
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
                  left: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 3,
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(20, 22, 35, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <FiChevronLeft size={22} />
              </button>

              <button
                onClick={handleNext}
                aria-label="Next Banner"
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 3,
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(20, 22, 35, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
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
                position: 'relative',
                zIndex: 3,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0 1rem 1.25rem',
              }}
            >
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  style={{
                    width: idx === safeIndex ? '26px' : '9px',
                    height: '9px',
                    borderRadius: '5px',
                    backgroundColor: idx === safeIndex ? '#ffb703' : 'rgba(255, 255, 255, 0.3)',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
              <span style={{ fontSize: '0.8rem', color: '#e2e4f0', marginLeft: '0.4rem', fontWeight: 700 }}>
                {safeIndex + 1}/{activeBanners.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBanners;
