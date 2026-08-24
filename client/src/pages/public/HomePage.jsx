import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiBook, FiVideo, FiFileText, FiStar } from 'react-icons/fi';
import { getAllCourses } from '../../api/courseApi';
import { formatPrice } from '../../utils/helpers';

const HomePage = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await getAllCourses({ limit: 6 });
        if (res.data && res.data.courses) {
          setCourses(res.data.courses);
        }
      } catch (err) {
        console.error('Error fetching courses', err);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div>
      <section className="hero" style={{ padding: '6rem 0', textAlign: 'center' }}>
        <div className="container">
          <h1 className="hero-title text-gradient" style={{ fontSize: '4rem', marginBottom: '1rem' }}>Learn Smarter. Grow Faster.</h1>
          <p className="hero-subtitle" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
            Join Sidd Academy to master your subjects with expert teachers, structured notes, and high-quality video classes.
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/courses" className="btn btn-primary btn-lg">Browse Courses</Link>
            <Link to="/notes" className="btn btn-outline btn-lg">View Notes</Link>
          </div>
        </div>
      </section>

      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '3rem 0' }}>
        <div className="container grid-4">
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>10k+</div>
            <div style={{ color: 'var(--text-muted)' }}>Students Enrolled</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>50+</div>
            <div style={{ color: 'var(--text-muted)' }}>Courses</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>500+</div>
            <div style={{ color: 'var(--text-muted)' }}>Notes Available</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>1000+</div>
            <div style={{ color: 'var(--text-muted)' }}>Video Classes</div>
          </div>
        </div>
      </section>

      <section className="section container" style={{ padding: '5rem 0' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="section-title">Featured Courses</h2>
          <p className="section-subtitle" style={{ color: 'var(--text-muted)' }}>Start your journey with our top-rated courses</p>
        </div>
        <div className="grid-3">
          {courses.map(course => (
            <div key={course._id} className="course-card card-glass">
              <img src={course.thumbnail || 'https://via.placeholder.com/300x200'} alt={course.title} className="course-card-img" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }} />
              <div className="course-card-body" style={{ padding: '1.5rem' }}>
                <h3 className="course-card-title" style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{course.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{course.instructor}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="price-tag" style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{course.isFree ? 'Free' : formatPrice(course.price)}</span>
                  <Link to={`/courses/${course._id}`} className="btn btn-sm btn-primary">View Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ backgroundColor: 'var(--bg-secondary)', padding: '5rem 0' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title">Why Sidd Academy</h2>
          </div>
          <div className="grid-4">
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
              <FiStar size={40} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
              <h3>Expert Teachers</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Learn from industry experts and experienced educators.</p>
            </div>
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
              <FiFileText size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
              <h3>Structured Notes</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Get comprehensive and easy-to-understand study materials.</p>
            </div>
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
              <FiVideo size={40} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
              <h3>Video Classes</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>High-quality video lectures accessible anytime, anywhere.</p>
            </div>
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
              <FiCheck size={40} color="var(--accent)" style={{ marginBottom: '1rem' }} />
              <h3>Affordable Prices</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Premium education that doesn't break the bank.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <div className="card-glass" style={{ padding: '4rem 2rem', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(255, 101, 132, 0.1) 100%)' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Need Study Materials?</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
            We have a huge library of digital notes for various subjects. Download free notes or purchase premium ones.
          </p>
          <Link to="/notes" className="btn btn-primary btn-lg">Browse Notes Library</Link>
        </div>
      </section>

      <section className="section" style={{ backgroundColor: 'var(--bg-secondary)', padding: '5rem 0' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title">What Our Students Say</h2>
          </div>
          <div className="grid-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-glass" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--accent-gold)', marginBottom: '1rem' }}>
                  <FiStar /><FiStar /><FiStar /><FiStar /><FiStar />
                </div>
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                  "Sidd Academy has completely transformed my learning experience. The notes are top-notch and the video classes are extremely helpful."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>S</div>
                  <div>
                    <h4 style={{ margin: 0 }}>Student {i}</h4>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Enrolled Student</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Ready to Start Your Journey?</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Join thousands of students and boost your career today.</p>
        <Link to="/register" className="btn btn-primary btn-lg">Get Started Now</Link>
      </section>
    </div>
  );
};

export default HomePage;
