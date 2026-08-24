import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiBook, FiVideo, FiFileText, FiStar, FiYoutube, FiArrowRight } from 'react-icons/fi';
import { getAllCourses } from '../../api/courseApi';
import { getActiveBanners } from '../../api/adminApi';
import HeroSection from '../../components/home/HeroSection';
import FeaturedBanners from '../../components/home/FeaturedBanners';
import CourseCard from '../../components/course/CourseCard';
import YouTubeVideoCard from '../../components/video/YouTubeVideoCard';

const HomePage = () => {
  const [courses, setCourses] = useState([]);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    const fetchCoursesAndBanners = async () => {
      try {
        const [courseRes, bannerRes] = await Promise.allSettled([
          getAllCourses({ limit: 6 }),
          getActiveBanners()
        ]);
        if (courseRes.status === 'fulfilled' && courseRes.value.data?.courses) {
          setCourses(courseRes.value.data.courses);
        }
        if (bannerRes.status === 'fulfilled' && bannerRes.value.data?.banners) {
          setBanners(bannerRes.value.data.banners);
        }
      } catch (err) {
        console.error('Error loading home data', err);
      }
    };
    fetchCoursesAndBanners();
  }, []);

  const sampleVideoLectures = [
    {
      _id: 'yt_sample_1',
      title: 'Class 10 Real Numbers & Fundamental Theorem (Complete Lecture)',
      description: 'Master CBSE Class 10 chapter 1 concepts, proofs, and high-scoring shortcuts.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '45 mins',
      isFree: true,
      chapterTitle: 'Class 10 • Mathematics',
      notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    {
      _id: 'yt_sample_2',
      title: 'Class 12 Electrostatics & Coulomb Law (Board & JEE Numerical solving)',
      description: 'Step-by-step vector mechanics and board derivation marking breakdown.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '52 mins',
      isFree: true,
      chapterTitle: 'Class 12 • Physics',
      notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    {
      _id: 'yt_sample_3',
      title: 'Chemical Reactions & Balancing Equations with 3D Animations',
      description: 'Visualizing reaction kinetics, redox reactions, and color precipitate tests.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '48 mins',
      isFree: true,
      chapterTitle: 'Class 10 • Science',
      notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
  ];

  return (
    <div>
      <HeroSection />

      {banners.length > 0 && <FeaturedBanners banners={banners} />}

      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '3rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container grid-4">
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>10k+</div>
            <div style={{ color: 'var(--text-muted)' }}>Students Enrolled</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>50+</div>
            <div style={{ color: 'var(--text-muted)' }}>Modular Courses</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>500+</div>
            <div style={{ color: 'var(--text-muted)' }}>Modular PDFs & Notes</div>
          </div>
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="stat-value text-gradient" style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>1000+</div>
            <div style={{ color: 'var(--text-muted)' }}>YouTube Video Classes</div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="section container" style={{ padding: '4.5rem 0' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 className="section-title" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Featured Academic Courses</h2>
          <p className="section-subtitle" style={{ color: 'var(--text-muted)' }}>Comprehensive curriculum designed for board exams & competitive tests</p>
        </div>
        <div className="grid-3">
          {courses.map(course => (
            <CourseCard key={course._id} course={course} />
          ))}
        </div>
      </section>

      {/* YouTube Video Classes Showcase */}
      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '4.5rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#ff4d4d', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                <FiYoutube size={18} /> Interactive Video Classes
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Free Video Lectures on YouTube</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', margin: 0 }}>
                Touch or click any video thumbnail to stream the full video lesson directly or open on YouTube.
              </p>
            </div>
            <Link to="/courses" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              All Lectures <FiArrowRight />
            </Link>
          </div>

          <div className="grid-3">
            {sampleVideoLectures.map(video => (
              <YouTubeVideoCard key={video._id} video={video} />
            ))}
          </div>
        </div>
      </section>

      {/* Modular Study Material Banner */}
      <section className="section container" style={{ padding: '4.5rem 0', textAlign: 'center' }}>
        <div className="card-glass" style={{ padding: '3.5rem 2rem', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.12) 0%, rgba(255, 101, 132, 0.12) 100%)' }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '1rem' }}>Modular Notes & Formula PDFs</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '650px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            Organized hierarchically: <strong>Subject &rarr; Chapter &rarr; PDF 1 / PDF 2</strong>. Download printable formulas, derivations, mind-maps, and question banks.
          </p>
          <Link to="/notes" className="btn btn-primary btn-lg" style={{ padding: '0.8rem 2rem' }}>
            Open Modular Notes Library
          </Link>
        </div>
      </section>

      <section className="section" style={{ backgroundColor: 'var(--bg-secondary)', padding: '4.5rem 0' }}>
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="section-title">Why Students Choose Sidd Academy</h2>
          </div>
          <div className="grid-4">
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
              <FiStar size={36} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
              <h3>Expert Faculty</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Learn from experienced educators and gold medalists.</p>
            </div>
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
              <FiFileText size={36} color="var(--primary)" style={{ marginBottom: '1rem' }} />
              <h3>Modular PDFs</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Structured notes: Subject &rarr; Chapter &rarr; PDF 1/2 format.</p>
            </div>
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
              <FiVideo size={36} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
              <h3>YouTube Lectures</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>High-definition video lectures with instant YouTube links.</p>
            </div>
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
              <FiCheck size={36} color="var(--accent)" style={{ marginBottom: '1rem' }} />
              <h3>Board Preparation</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Proven question banks and previous 10-year paper solutions.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

