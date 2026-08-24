import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCourses } from '../../api/courseApi';
import { formatPrice, debounce } from '../../utils/helpers';
import Loader from '../../components/common/Loader';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('');

  const fetchCourses = async (query = '', lvl = '') => {
    setLoading(true);
    try {
      const params = {};
      if (query) params.search = query;
      if (lvl) params.level = lvl;
      const res = await getAllCourses(params);
      if (res.data && res.data.courses) {
        setCourses(res.data.courses);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleSearch = debounce((e) => {
    setSearch(e.target.value);
    fetchCourses(e.target.value, level);
  }, 500);

  const handleLevelChange = (e) => {
    setLevel(e.target.value);
    fetchCourses(search, e.target.value);
  };

  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>All Courses</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search courses..." 
            className="form-input" 
            style={{ maxWidth: '400px' }}
            onChange={handleSearch}
          />
          <select className="form-select" style={{ maxWidth: '200px' }} onChange={handleLevelChange} value={level}>
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
          <Loader />
        </div>
      ) : (
        <>
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              No courses found matching your criteria.
            </div>
          ) : (
            <div className="grid-3">
              {courses.map(course => (
                <div key={course._id} className="course-card card-glass">
                  <img src={course.thumbnail || 'https://via.placeholder.com/300x200'} alt={course.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }} />
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className={`badge ${course.level === 'Beginner' ? 'badge-success' : 'badge-primary'}`}>{course.level}</span>
                    </div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{course.title}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>By {course.instructor}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem' }}>{course.isFree ? 'Free' : formatPrice(course.price)}</span>
                      <Link to={`/courses/${course._id}`} className="btn btn-sm btn-primary">View</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CoursesPage;
