import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div style={{ height: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <h1 className="text-gradient" style={{ fontSize: '8rem', fontWeight: 'bold', lineHeight: 1 }}>404</h1>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
};

export default NotFoundPage;
