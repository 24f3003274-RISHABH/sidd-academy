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
        if (courseRes.status === 'fulfilled') {
          const coursesList = courseRes.value.data?.data?.courses || courseRes.value.data?.courses || [];
          setCourses(coursesList);
        }
        if (bannerRes.status === 'fulfilled') {
          const bannersList = bannerRes.value.data?.data?.banners || bannerRes.value.data?.banners || [];
          setBanners(bannersList);
        }
      } catch (err) {
        console.error('Error loading home data', err);
      }
    };
    fetchCoursesAndBanners();
  }, []);

  const clientYouTubeVideos = [
    {
      _id: 'yt_chem_06',
      title: 'LEC 06 chemical kinetics FACTOR AFFECTING RATE OF RXN #iit #jee #hindi #upboard #biharboard',
      description: 'सबसे आसान भाषा में समझें - Effect of Temp, Concentration, Catalyst, Surface Area on Reaction Rate by SID ACADEMY PRAYAGRAJ.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '33:32',
      isFree: true,
      chapterTitle: 'Class 12 • Chemistry (रासायनिक बलगतिकी)',
      instructor: 'Siddhant Pandey & Aakash Sir',
      thumbnailUrl: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=600&auto=format&fit=crop&q=80',
      notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    {
      _id: 'yt_bio_02',
      title: 'LEC 02 पुष्पी पादपो में लैंगिक जनन by आकाश सर #upboard #mpboard #biharboard #boardexam #biology',
      description: 'Basic to Advance: Embryo Sac development, Pollen-Pistil interaction & Double Fertilization by आकाश सर.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '25:03',
      isFree: true,
      chapterTitle: 'Class 12 • Biology (Sexual Reproduction)',
      instructor: 'आकाश सर (Aakash Sir)',
      thumbnailUrl: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=600&auto=format&fit=crop&q=80',
      notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    {
      _id: 'yt_eng_01',
      title: 'conversation use of to और With by आकाश सर #english #englishgrammar #class12 #upboard #boardexam',
      description: 'Spoken English & Board Exam Grammar: Exact rules for using "To" vs "With" in sentences.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '7:03',
      isFree: true,
      chapterTitle: 'Class 12 • English Grammar',
      instructor: 'आकाश सर (Aakash Sir)',
      thumbnailUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80',
      notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    {
      _id: 'yt_chem_05',
      title: 'Chemical kinetics LEC 05 question ❓ #chemistry #class12 #neet #jee #upboard #mpboard #biharboard',
      description: 'ज़रूर देखे Basic to Advance: High yield numericals on Rate Constant, Half Life & Collision Theory.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '29:58',
      isFree: true,
      chapterTitle: 'Class 12 • Chemistry (Numericals)',
      instructor: 'SID ACADEMY Faculty',
      thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80',
      notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    {
      _id: 'yt_bio_01',
      title: 'LEC 01 पुष्पी पादपों में लैंगिक जनन #flowers #biology #basic #class12 #upboard #mpboard #biharboard',
      description: 'Flower Structure, Stamen, Microsporangium, and Pollen Grain development step-by-step.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '14:32',
      isFree: true,
      chapterTitle: 'Class 12 • Biology (Flower Morphology)',
      instructor: 'आकाश सर (Aakash Sir)',
      thumbnailUrl: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=600&auto=format&fit=crop&q=80',
      notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    },
    {
      _id: 'yt_regular_launch',
      title: 'जो वादा किया उससे निभाना पड़ेगा SID ACADEMY PRAYAGRAJ 💥 जहां आपकी सफलता हमारी जिम्मेदारी 🤩#study',
      description: '20 AUGUST नई शुरुआत — Regular Classroom & Online Batch Start with Siddhant Pandey.',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '23:29',
      isFree: true,
      chapterTitle: 'SID ACADEMY PRAYAGRAJ • Batch Orientation',
      instructor: 'Siddhant Pandey & Team',
      thumbnailUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#ff4d4d', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', backgroundColor: 'rgba(255, 77, 77, 0.1)', padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(255, 77, 77, 0.25)' }}>
                <FiYoutube size={18} color="#ff0000" /> OFFICIAL YOUTUBE CHANNEL • @A2CCENTRE
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.4rem 0 0.5rem 0' }}>
                Free Video Lectures from SID ACADEMY PRAYAGRAJ
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '680px', fontSize: '0.95rem' }}>
                High-yield video lectures on Chemical Kinetics, Sexual Reproduction in Plants, and English Grammar by Akash Sir & Siddhant Pandey. Touch to play immediately or subscribe on YouTube!
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a 
                href="https://www.youtube.com/@A2CCENTRE" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary"
                style={{ backgroundColor: '#ff0000', borderColor: '#ff0000', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
              >
                <FiYoutube size={18} /> Visit @A2CCENTRE
              </a>
              <Link to="/courses" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                All Courses <FiArrowRight />
              </Link>
            </div>
          </div>

          <div className="grid-3">
            {clientYouTubeVideos.map(video => (
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

