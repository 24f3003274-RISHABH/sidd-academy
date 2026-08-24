import React, { useState, useEffect } from 'react';
import { getAllBanners, createBanner, updateBanner, deleteBanner } from '../../api/adminApi';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '', subtitle: '', imageUrl: '', linkUrl: '', isActive: true
  });

  const fetchBanners = async () => {
    try {
      const res = await getAllBanners();
      setBanners(res.data.banners || []);
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
        title: banner.title, subtitle: banner.subtitle, 
        imageUrl: banner.imageUrl, linkUrl: banner.linkUrl, 
        isActive: banner.isActive
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', subtitle: '', imageUrl: '', linkUrl: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateBanner(editingId, formData);
        toast.success('Banner updated');
      } else {
        await createBanner(formData);
        toast.success('Banner created');
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      toast.error('Error saving banner');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await deleteBanner(id);
        toast.success('Banner deleted');
        fetchBanners();
      } catch (err) {
        toast.error('Error deleting banner');
      }
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Manage Banners</h1>
        <button onClick={() => openModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiPlus /> Add Banner
        </button>
      </div>

      <div className="card-glass" style={{ padding: '1.5rem' }}>
        {banners.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>No banners found.</div>
        ) : (
          <div className="grid-2">
            {banners.map(banner => (
              <div key={banner._id} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem', position: 'relative' }}>
                <img src={banner.imageUrl || 'https://via.placeholder.com/600x200'} alt={banner.title} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{banner.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{banner.subtitle}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${banner.isActive ? 'badge-success' : 'badge-paid'}`}>{banner.isActive ? 'Active' : 'Inactive'}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openModal(banner)} className="btn btn-sm btn-outline" style={{ padding: '0.5rem' }}><FiEdit2 /></button>
                    <button onClick={() => handleDelete(banner._id)} className="btn btn-sm btn-danger" style={{ padding: '0.5rem' }}><FiTrash2 /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Banner' : 'Add Banner'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input type="text" className="form-input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Subtitle</label>
            <input type="text" className="form-input" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input type="text" className="form-input" required value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Link URL (Optional)</label>
            <input type="text" className="form-input" value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} style={{ width: '20px', height: '20px' }} />
              <span>Is Active</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Banner</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageBanners;
