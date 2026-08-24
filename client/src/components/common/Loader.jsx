import React from 'react';

const Loader = ({ fullPage, size = 40 }) => {
  if (fullPage) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          width: size,
          height: size,
          border: '4px solid var(--bg-secondary)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      width: size,
      height: size,
      border: '4px solid var(--bg-secondary)',
      borderTopColor: 'var(--primary)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
  );
};

export default Loader;
