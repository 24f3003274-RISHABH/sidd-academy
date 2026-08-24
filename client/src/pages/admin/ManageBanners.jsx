import React, { useState, useEffect } from 'react';
import { getAllBanners, createBanner, updateBanner, deleteBanner } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiEdit2, FiTrash2, FiPlus, FiEye, FiCheck, FiX, FiZap, FiExternalLink, FiLayers, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PRESET_TEMPLATES = [
  {
    name: '⚡ Crash Course Banner',
    title: 'Class 10 & 12 Board Exam 45-Day Crash Course',
    subtitle: 'Complete syllabus revision with high-yield formula sheets, live problem-solving, and previous 10-year question banks.',
    badge: '⚡ CRASH COURSE 2024-25',
    buttonText: 'Join Crash Course',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',
    linkUrl: '/courses',
  },
  {
    name: '🎯 Masterclass Banner',
    title: 'Mathematics & Physics Fast-Track Masterclass',
    subtitle: 'Crack tough numericals and derivations with shortcut techniques by expert faculty Siddhant Pandey.',
    badge: '🎯 SPECIAL MASTERCLASS',
    buttonText: 'Explore Masterclass',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&auto=format&fit=crop&q=80',
    linkUrl: '/courses',
  },
  {
    name: '📚 Notes Library Banner',
    title: 'Modular Handwritten Notes & Formula PDFs Library',
    subtitle: 'Subject-wise and Chapter-wise organized PDFs ready for instant download and offline revision.',
    badge: '📚 FREE STUDY MATERIAL',
    buttonText: 'Browse Modular Notes',
    imageUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=1200&auto=format&fit=crop&q=80',
    linkUrl: '/notes',
  },
  {
    name: '🔥 Discount Offer Banner',
    title: 'Early Bird Special: Flat 50% Off On All Annual Batches',
    subtitle: 'Use code SIDD50 at checkout to unlock full video lectures, test series, and modular notes.',
    badge: '🔥 LIMITED TIME OFFER',
    buttonText: 'Claim Discount',
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&auto=format&fit=crop&q=80',
    linkUrl: '/courses',
  },
];

const ManageBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge: '⚡ CRASH COURSE',
    buttonText: 'Explore Now',
    imageUrl: '',
    linkUrl: '/courses',
    isActive: true,
    order: 1,
  });

  const fetchBanners = async () => {
    try {
      const res = await getAllBanners();
      const list = res.data?.data?.banners || res.data?.banners || [];
      setBanners(list);
    } catch (err) {
      toast.error('Failed to fetch banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openModal = (banner = null) => {
    if (banner) {
      setEditingId(banner._id);
      setFormData({
        title: banner.title || '',
        subtitle: banner.subtitle || '',
        badge: banner.badge || '🔥 SPECIAL ANNOUNCEMENT',
        buttonText: banner.buttonText || 'Explore Now',
        imageUrl: banner.imageUrl || '',
        linkUrl: banner.linkUrl || '/courses',
        isActive: banner.isActive !== undefined ? banner.isActive : true,
        order: banner.order || 1,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        subtitle: '',
        badge: '⚡ CRASH COURSE',
        buttonText: 'Join Crash Course',
        imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',
        linkUrl: '/courses',
        isActive: true,
        order: banners.length + 1,
      });
    }
    setIsModalOpen(true);
  };

  const applyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      title: preset.title,
      subtitle: preset.subtitle,
      badge: preset.badge,
      buttonText: preset.buttonText,
      imageUrl: preset.imageUrl,
      linkUrl: preset.linkUrl,
    }));
    toast.success(`Applied template: ${preset.name}`);
  };

  const handleToggleActive = async (banner) => {
    try {
      const updatedStatus = !banner.isActive;
      await updateBanner(banner._id, { ...banner, isActive: updatedStatus });
      toast.success(updatedStatus ? 'Banner is now visible on Home Page' : 'Banner hidden from Home Page');
      fetchBanners();
    } catch (err) {
      toast.error('Failed to update banner status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateBanner(editingId, formData);
        toast.success('Banner updated successfully');
      } else {
        await createBanner(formData);
        toast.success('New banner added to Home Page carousel');
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      toast.error('Error saving banner');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this banner from the home carousel?')) {
      try {
        await deleteBanner(id);
        toast.success('Banner removed');
        fetchBanners();
      } catch (err) {
        toast.error('Error deleting banner');
      }
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Home Page Sliding Banners</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage floating & sliding banners on the home page for crash courses, masterclasses, and offers.
          </p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiPlus /> Add New Banner
        </button>
      </div>

      {/* Preset Quick Templates */}
      <div className="card-glass" style={{ padding: '1.25rem', marginBottom: '2rem', borderRadius: '12px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FiZap color="#ffb703" /> Quick Add Banner Templates
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {PRESET_TEMPLATES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                openModal();
                setTimeout(() => applyPreset(preset), 50);
              }}
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <FiPlus size={12} /> {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Banners Grid */}
      <div className="card-glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
        {banners.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
            <p style={{ marginBottom: '1rem' }}>No banners created yet.</p>
            <button onClick={() => openModal()} className="btn btn-primary btn-sm">Create First Banner</button>
          </div>
        ) : (
          <div className="grid-2">
            {banners.map(banner => (
              <div 
                key={banner._id} 
                style={{ 
                  border: banner.isActive ? '1px solid rgba(108, 99, 255, 0.4)' : '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '12px', 
                  padding: '1.25rem', 
                  position: 'relative',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ position: 'relative', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <img 
                      src={banner.imageUrl || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80'} 
                      alt={banner.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <span 
                      style={{ 
                        position: 'absolute', 
                        top: '8px', 
                        left: '8px', 
                        backgroundColor: 'rgba(0,0,0,0.75)', 
                        color: '#ffb703', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '4px',
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      {banner.badge || 'PROMOTION'}
                    </span>
                    <span 
                      className={`badge ${banner.isActive ? 'badge-success' : 'badge-paid'}`}
                      style={{ position: 'absolute', top: '8px', right: '8px' }}
                    >
                      {banner.isActive ? 'Active on Home' : 'Hidden'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem', lineHeight: 1.3 }}>{banner.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.4, marginBottom: '0.75rem' }}>{banner.subtitle}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--primary)' }}>
                    <span>Button: <strong>{banner.buttonText || 'Explore Now'}</strong></span>
                    <span>•</span>
                    <span>Link: <code>{banner.linkUrl || '/courses'}</code></span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                  <button 
                    onClick={() => handleToggleActive(banner)}
                    className={`btn btn-sm ${banner.isActive ? 'btn-outline' : 'btn-primary'}`}
                    style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.75rem' }}
                  >
                    {banner.isActive ? <><FiX /> Hide from Home</> : <><FiCheck /> Show on Home</>}
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => openModal(banner)} 
                      className="btn btn-sm btn-outline" 
                      title="Edit banner"
                      style={{ padding: '0.45rem 0.75rem' }}
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(banner._id)} 
                      className="btn btn-sm btn-danger" 
                      title="Delete banner"
                      style={{ padding: '0.45rem 0.75rem' }}
                    >
                      <FiTrash2 /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Banner Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Sliding Banner' : 'Create Home Banner'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Quick preset selector inside modal */}
          {!editingId && (
            <div style={{ backgroundColor: 'rgba(108, 99, 255, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(108, 99, 255, 0.2)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#939aff', marginBottom: '0.4rem' }}>Or pick a template:</div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {PRESET_TEMPLATES.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="badge badge-primary"
                    style={{ border: 'none', cursor: 'pointer', padding: '0.3rem 0.6rem' }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Badge / Category Tag</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={formData.badge} 
                onChange={e => setFormData({...formData, badge: e.target.value})} 
                placeholder="e.g. ⚡ CRASH COURSE 2024-25"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Button Action Text</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={formData.buttonText} 
                onChange={e => setFormData({...formData, buttonText: e.target.value})} 
                placeholder="e.g. Join Crash Course"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Banner Headline / Title</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder="e.g. Class 10 & 12 Board Exam 45-Day Crash Course"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Subtitle / Description</label>
            <textarea 
              className="form-textarea" 
              rows="2" 
              value={formData.subtitle} 
              onChange={e => setFormData({...formData, subtitle: e.target.value})} 
              placeholder="Brief description of the course, batch timings, or discount details"
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Background Image URL</label>
            <input 
              type="text" 
              className="form-input" 
              required 
              value={formData.imageUrl} 
              onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Click Link Destination</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.linkUrl} 
                onChange={e => setFormData({...formData, linkUrl: e.target.value})} 
                placeholder="/courses or /notes or /register"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Display Order</label>
              <input 
                type="number" 
                className="form-input" 
                value={formData.order} 
                onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 1})} 
              />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={formData.isActive} 
                onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                style={{ width: '20px', height: '20px' }} 
              />
              <span style={{ fontWeight: 600 }}>Active on Home Page Carousel</span>
            </label>
          </div>

          {/* Live Preview Box */}
          <div style={{ marginTop: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden', position: 'relative', height: '120px' }}>
            <img 
              src={formData.imageUrl || 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80'} 
              alt="Preview" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3)' }} 
            />
            <div style={{ position: 'absolute', inset: 0, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#ffb703', fontWeight: 800 }}>{formData.badge || 'BADGE'}</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {formData.title || 'Banner Title Preview'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#ccc', marginTop: '0.2rem' }}>
                Button: <strong style={{ color: 'var(--primary)' }}>{formData.buttonText || 'Explore Now'}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update Banner' : 'Save & Publish Banner'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageBanners;
