import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

const FeaturedBanners = ({ banners = [] }) => {
  if (!banners || banners.length === 0) return null;

  return (
    <section style={{ margin: '2rem 0' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: banners.length > 1 ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr', gap: '1.5rem' }}>
          {banners.map((banner) => (
            <div
              key={banner._id}
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                padding: '2rem',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url(${banner.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'brightness(0.3)',
                  zIndex: 0,
                }}
              />
              <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                  {banner.title}
                </h3>
                <p style={{ color: '#ddd', fontSize: '0.95rem', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                  {banner.subtitle}
                </p>
                {banner.linkUrl && (
                  <Link 
                    to={banner.linkUrl}
                    className="btn btn-sm btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    Learn More <FiArrowRight />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBanners;
