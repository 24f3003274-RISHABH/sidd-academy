import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill all fields');
      return;
    }
    // Simulate API call
    setTimeout(() => {
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    }, 1000);
  };

  return (
    <div className="container" style={{ padding: '4rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Contact Us</h1>
        <p style={{ color: 'var(--text-muted)' }}>Have a question? We'd love to hear from you.</p>
      </div>

      <div className="grid-2" style={{ gap: '4rem' }}>
        <div className="card-glass" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Send us a Message</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Your Name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="your@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-textarea" rows="5" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="How can we help you?"></textarea>
            </div>
            <button type="submit" className="btn btn-primary btn-full">Send Message</button>
          </form>
        </div>

        <div>
          <h2 style={{ marginBottom: '1.5rem' }}>Contact Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
            <div>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Email</h4>
              <p>support@siddacademy.com</p>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Phone</h4>
              <p>+91 8756940318</p>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Address</h4>
              <p>Rajapur, Prayagraj, U.P., India, 100002</p>
            </div>
          </div>
          
          <div className="card-glass" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Map Placeholder
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
