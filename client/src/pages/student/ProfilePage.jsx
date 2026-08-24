import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile, changePassword } from '../../api/authApi';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateProfile(profileData);
      updateUser(res.data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await changePassword({ currentPassword: passData.currentPassword, newPassword: passData.newPassword });
      toast.success('Password updated successfully');
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>My Profile</h1>
      
      <div className="grid-2" style={{ gap: '2rem' }}>
        <div>
          <div className="card-glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Personal Information</h2>
            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Email (Cannot be changed)</label>
                <input type="email" className="form-input" disabled value={user?.email || ''} style={{ opacity: 0.7 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-input" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" className="form-input" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>Update Profile</button>
            </form>
          </div>
          
          <div className="card-glass" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Account Details</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <p><strong>Member Since:</strong> {formatDate(user?.createdAt)}</p>
              <p><strong>Role:</strong> <span style={{ textTransform: 'capitalize' }}>{user?.role}</span></p>
              <p><strong>Enrolled Courses:</strong> {user?.purchasedCourses?.length || 0}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="card-glass" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Change Password</h2>
            <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" value={passData.currentPassword} onChange={e => setPassData({...passData, currentPassword: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={passData.newPassword} onChange={e => setPassData({...passData, newPassword: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" value={passData.confirmPassword} onChange={e => setPassData({...passData, confirmPassword: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-outline" disabled={loading}>Change Password</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
