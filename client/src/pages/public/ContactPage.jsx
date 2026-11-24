import React, { useState } from 'react';
import toast from 'react-hot-toast';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill all fields');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
      setSubmitting(false);
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
            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        <div>
          <h2 style={{ marginBottom: '1.5rem' }}>Contact Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Email Support</h4>
              <p style={{ fontWeight: 600 }}>support@siddacademy.com</p>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Phone & WhatsApp</h4>
              <p style={{ fontWeight: 600 }}>+91 8756940318, +91 8452895409</p>
            </div>
            <div>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.85rem', textTransform: 'uppercase' }}>Offline Campus Address</h4>
              <p style={{ fontWeight: 600 }}>Near Gali No. 20, Ganga Nagar, Rajapur, Prayagraj, Uttar Pradesh, India (211001)</p>
            </div>
          </div>

          <div
            className="card-glass"
            style={{
              padding: '1.5rem',
              borderRadius: '14px',
              backgroundColor: 'var(--primary-subtle)',
              border: '1px solid var(--primary-border)',
            }}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.5rem' }}>
              SIDD ACADEMY PRAYAGRAJ — Admissions & Batch Enquiry
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              Visit our Rajapur, Prayagraj centre for offline batch registrations (Class 10th, 11th & 12th Special Target Batches) or enroll online 24×7 through our course portal.
            </p>
            <div style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
              Timings: Monday – Saturday • 7:00 AM to 7:00 PM
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
