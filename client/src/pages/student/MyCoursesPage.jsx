import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getMe } from '../../api/authApi';
import { getCourseById } from '../../api/courseApi';
import { Link } from 'react-router-dom';
import Loader from '../../components/common/Loader';

const MyCoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const res = await getMe();
        const purchasedIds = res.data.user?.purchasedCourses || [];
        
        const coursePromises = purchasedIds.map(id => getCourseById(id));
        const results = await Promise.allSettled(coursePromises);
        
        const loadedCourses = results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value.data.course);
          
        setCourses(loadedCourses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, []);

  if (loading) return <Loader fullPage />;

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <h1 style={{ marginBottom: '2rem' }}>My Courses</h1>
      
      {courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
          <p style={{ marginBottom: '1rem' }}>You haven't enrolled in any courses yet.</p>
          <Link to="/courses" className="btn btn-primary">Browse Courses</Link>
        </div>
      ) : (
        <div className="grid-3">
          {courses.map(course => (
            <div key={course._id} className="course-card card-glass">
              <img src={course.thumbnail || 'https://via.placeholder.com/300x200'} alt={course.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }} />
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{course.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>By {course.instructor}</p>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '1.5rem' }}>
                  <div style={{ width: '0%', height: '100%', backgroundColor: 'var(--accent)', borderRadius: '3px' }}></div>
                </div>
                <Link to={`/courses/${course._id}`} className="btn btn-sm btn-primary" style={{ display: 'block', textAlign: 'center' }}>Continue Learning</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCoursesPage;
