import React from 'react';

const Loader = ({ fullPage, size = 40, label = 'Loading' }) => {
  if (fullPage) {
    return (
      <div className="loader-full-page">
        <div className="loader-spinner" role="status" aria-label={label} style={{ '--loader-size': `${size}px` }} />
      </div>
    );
  }

  return (
    <div className="loader-inline">
      <div className="loader-spinner" role="status" aria-label={label} style={{ '--loader-size': `${size}px` }} />
    </div>
  );
};

export default Loader;
