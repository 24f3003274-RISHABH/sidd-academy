import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';

const resolveReturnPath = (location) => {
  const queryFrom = new URLSearchParams(location.search).get('from');
  const rawFrom = location.state?.from;
  const candidate =
    typeof rawFrom === 'string'
      ? rawFrom
      : rawFrom?.pathname
      ? `${rawFrom.pathname}${rawFrom.search || ''}`
      : queryFrom || '/student/dashboard';

  if (!candidate || candidate.startsWith('/login') || candidate.startsWith('/register')) {
    return '/student/dashboard';
  }
  return candidate;
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const from = resolveReturnPath(location);

  // Wake up Render free-tier backend while user enters credentials
  useEffect(() => {
    axiosInstance.get('/health', { cache: false }).catch(() => {});
  }, []);

  // Redirect already authenticated users immediately
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const role = (user.role || '').toLowerCase();
      navigate(role === 'admin' ? '/admin/dashboard' : from, { replace: true });
    }
  }, [authLoading, isAuthenticated, user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const data = await login({ email: email.trim(), password });
      toast.success('Login successful! Welcome back.');
      const role = (data?.user?.role || '').toLowerCase();
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 1rem', display: 'flex', justifyContent: 'center' }}>
      <div className="card-glass" style={{ padding: '2.5rem', width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)' }}>Login to continue learning</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              autoComplete="email"
              className="form-input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              className="form-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><Loader size={18} label="Logging in" /> Logging in...</> : 'Login'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          <p>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
