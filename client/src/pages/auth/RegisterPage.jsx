import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const { register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password });
      toast.success('Registration successful');
      navigate('/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '4rem 0', display: 'flex', justifyContent: 'center' }}>
      <div className="card-glass" style={{ padding: '3rem', width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)' }}>Join Sidd Academy today</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input type="text" className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email Address" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="text" className="form-input" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Phone Number" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Password" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input type="password" className="form-input" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} placeholder="Confirm Password" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)' }}>
          <p>Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
