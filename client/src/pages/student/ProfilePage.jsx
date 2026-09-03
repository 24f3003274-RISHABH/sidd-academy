import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile, changePassword, sendMobileOtp, verifyMobileOtp } from '../../api/authApi';
import StudentLayout from '../../components/student/StudentLayout';
import OtpInput from '../../components/common/OtpInput';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiShield,
  FiBook,
  FiFileText,
  FiX,
} from 'react-icons/fi';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
];

const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });

  const [passData, setPassData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  // Mobile Verification State
  const [showMobileOtpModal, setShowMobileOtpModal] = useState(false);
  const [mobileOtpLoading, setMobileOtpLoading] = useState(false);
  const [mobileOtpError, setMobileOtpError] = useState('');
  const [mobileMasked, setMobileMasked] = useState('');

  const isPhoneVerified = Boolean(user?.phone_verified || user?.phoneVerified);
  const isEmailVerified = Boolean(user?.email_verified || user?.emailVerified);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const res = await updateProfile(profileData);
      const updated = res.data?.data?.user || res.data?.user || res.data;
      updateUser(updated);
      toast.success('Profile details updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    if (passData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoadingPass(true);
    try {
      await changePassword({
        oldPassword: passData.oldPassword,
        newPassword: passData.newPassword,
      });
      toast.success('Password updated successfully! Please use it next time you login.');
      setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoadingPass(false);
    }
  };

  // Trigger sending mobile verification OTP
  const handleInitiateMobileVerification = async () => {
    const targetPhone = profileData.phone || user?.phone;
    if (!targetPhone) {
      toast.error('Please enter a valid mobile number first.');
      return;
    }

    setMobileOtpLoading(true);
    setMobileOtpError('');
    try {
      const res = await sendMobileOtp({ phone: targetPhone });
      const data = res.data?.data || res.data;
      setMobileMasked(data?.maskedPhone || targetPhone);
      setShowMobileOtpModal(true);
      toast.success('Verification code sent to your mobile!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send verification SMS.';
      toast.error(msg);
    } finally {
      setMobileOtpLoading(false);
    }
  };

  // Verify entered mobile OTP
  const handleVerifyMobileOtp = async (otpCode) => {
    const targetPhone = profileData.phone || user?.phone;
    setMobileOtpLoading(true);
    setMobileOtpError('');
    try {
      const res = await verifyMobileOtp({ phone: targetPhone, otp: otpCode });
      toast.success('Mobile number verified successfully!');
      updateUser({
        ...user,
        phone: res.data?.data?.phone || targetPhone,
        phone_verified: true,
        phoneVerified: true,
      });
      setShowMobileOtpModal(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Verification failed';
      setMobileOtpError(msg);
    } finally {
      setMobileOtpLoading(false);
    }
  };

  return (
    <StudentLayout
      title="Student Profile & Settings"
      subtitle="Manage your personal details, avatar, contact information, and security credentials."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Personal Information & Avatars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Profile Form Card */}
          <div className="card-glass" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiUser style={{ color: 'var(--primary)' }} /> Personal Information
            </h2>

            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Avatar Selector */}
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Choose Avatar</label>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {AVATAR_OPTIONS.map((imgUrl, idx) => (
                    <img
                      key={idx}
                      src={imgUrl}
                      alt={`Avatar ${idx + 1}`}
                      onClick={() => setProfileData({ ...profileData, avatar: imgUrl })}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: profileData.avatar === imgUrl ? '2px solid var(--primary)' : '2px solid transparent',
                        padding: profileData.avatar === imgUrl ? '2px' : '0',
                        opacity: profileData.avatar === imgUrl ? 1 : 0.6,
                        transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Email (Read only) */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Email Address</label>
                  {isEmailVerified ? (
                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                      <FiCheckCircle /> Verified
                    </span>
                  ) : (
                    <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>
                      Pending
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <FiMail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    className="form-input"
                    disabled
                    value={user?.email || ''}
                    style={{ paddingLeft: '2.5rem', opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Email address is linked to your account enrollments.
                </span>
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <FiUser style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Mobile Number (India)</label>
                  {isPhoneVerified ? (
                    <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                      <FiCheckCircle /> Verified
                    </span>
                  ) : profileData.phone ? (
                    <button
                      type="button"
                      onClick={handleInitiateMobileVerification}
                      disabled={mobileOtpLoading}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '0.15rem 0.6rem', fontSize: '0.75rem' }}
                    >
                      {mobileOtpLoading ? 'Sending...' : 'Verify Mobile'}
                    </button>
                  ) : null}
                </div>
                <div style={{ position: 'relative' }}>
                  <FiPhone style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="10-digit number e.g. 9876543210"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loadingProfile} style={{ marginTop: '0.5rem' }}>
                {loadingProfile ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </form>
          </div>

          {/* Account Details & Badges */}
          <div className="card-glass" style={{ padding: '1.75rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiShield style={{ color: 'var(--accent-dark)' }} /> Account Verification
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiCalendar /> Member Since:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatDate(user?.createdAt)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiCheckCircle /> Role:</span>
                <span style={{ textTransform: 'capitalize', color: 'var(--primary)', fontWeight: 700 }}>
                  {user?.role || 'Student'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiMail /> Email Verification:</span>
                <span style={{ fontWeight: 600, color: isEmailVerified ? 'var(--accent-dark)' : 'var(--secondary-dark)' }}>
                  {isEmailVerified ? 'Verified' : 'Pending'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiPhone /> Mobile Verification:</span>
                <span style={{ fontWeight: 600, color: isPhoneVerified ? 'var(--accent-dark)' : 'var(--text-muted)' }}>
                  {isPhoneVerified ? 'Verified' : (profileData.phone ? 'Unverified' : 'Not Provided')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiBook /> Enrolled Courses:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{user?.purchasedCourses?.length || 0}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiFileText /> Purchased Notes:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{user?.purchasedNotes?.length || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Security & Password Update */}
        <div>
          <div className="card-glass" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiLock style={{ color: 'var(--secondary)' }} /> Change Password
            </h2>

            <form onSubmit={handlePasswordUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter your current password"
                  value={passData.oldPassword}
                  onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={passData.newPassword}
                  onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-type new password"
                  value={passData.confirmPassword}
                  onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn btn-outline" disabled={loadingPass} style={{ marginTop: '0.5rem' }}>
                {loadingPass ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile OTP Verification Modal */}
      {showMobileOtpModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Verify Mobile Number</h3>
              <button
                className="modal-close"
                onClick={() => setShowMobileOtpModal(false)}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>
            <OtpInput
              maskedIdentifier={mobileMasked}
              channel="sms"
              cooldownSeconds={60}
              onVerify={handleVerifyMobileOtp}
              onResend={handleInitiateMobileVerification}
              isLoading={mobileOtpLoading}
              error={mobileOtpError}
              onChangeError={setMobileOtpError}
              submitLabel="Verify Mobile"
            />
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default ProfilePage;
