import React from 'react';

export const SkeletonCard = ({ height = '200px', count = 1 }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-pulse"
          style={{
            height,
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        />
      ))}
    </div>
  );
};

export const SkeletonDashboard = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
      {/* Header skeleton */}
      <div style={{ height: '140px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px' }} />
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: '90px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }} />
        ))}
      </div>
      {/* 2 column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div style={{ height: '320px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px' }} />
        <div style={{ height: '320px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px' }} />
      </div>
    </div>
  );
};

export default {
  SkeletonCard,
  SkeletonDashboard,
};
