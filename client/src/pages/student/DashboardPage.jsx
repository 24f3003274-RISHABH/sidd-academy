import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getMe } from '../../api/authApi';
import { Link } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { FiBook, FiFileText } from 'react-icons/fi';

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, notes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getMe();
        if (res.data && res.data.user) {
          setStats({
            courses: res.data.user.purchasedCourses?.length || 0,
            notes: res.data.user.purchasedNotes?.length || 0
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <Loader fullPage />;

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>Welcome back, {user?.name}!</h1>
      
      <div className="grid-2" style={{ marginBottom: '3rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(108, 99, 255, 0.1)', borderRadius: '8px', color: 'var(--primary)' }}><FiBook size={24} /></div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>My Courses</div>
              <div className="stat-value">{stats.courses}</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'rgba(255, 101, 132, 0.1)', borderRadius: '8px', color: 'var(--secondary)' }}><FiFileText size={24} /></div>
            <div>
              <div style={{ color: 'var(--text-muted)' }}>My Notes</div>
              <div className="stat-value">{stats.notes}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card-glass" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Recent Courses</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You have {stats.courses} enrolled courses.</p>
          <Link to="/student/my-courses" className="btn btn-primary">View All Courses</Link>
        </div>
        <div className="card-glass" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>My Notes</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You have access to {stats.notes} premium notes.</p>
          <Link to="/notes" className="btn btn-outline">Browse Notes</Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
