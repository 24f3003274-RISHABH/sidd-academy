import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[App ErrorBoundary]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'var(--bg-primary, #f8fafc)',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '2.5rem 2rem',
              textAlign: 'center',
              borderRadius: '16px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <FiAlertTriangle size={26} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
              Something went wrong
            </h1>
            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.92rem', margin: '0 0 1.5rem 0', lineHeight: 1.55 }}>
              An unexpected display error occurred. Reloading the page usually resolves it immediately.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={this.handleReload} className="btn btn-primary btn-sm">
                <FiRefreshCw size={14} /> Reload Page
              </button>
              <button type="button" onClick={this.handleGoHome} className="btn btn-outline btn-sm">
                <FiHome size={14} /> Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
