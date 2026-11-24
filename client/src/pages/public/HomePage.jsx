import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiBook, FiVideo, FiFileText, FiStar, FiYoutube, FiArrowRight, FiDownloadCloud } from 'react-icons/fi';
import { getAllCourses } from '../../api/courseApi';
import { getActiveBanners } from '../../api/adminApi';
import { useAuth } from '../../hooks/useAuth';
import HeroSection from '../../components/home/HeroSection';
import FeaturedBanners from '../../components/home/FeaturedBanners';
import CourseCard from '../../components/course/CourseCard';
import YouTubeVideoCard from '../../components/video/YouTubeVideoCard';

const OFFICIAL_POSTER_BANNERS = [
  {
    id: 'official_poster_1',
    title: 'TARGET BATCH — UP Board • CBSE Board • JEE Mains (100 Days Left)',
    subtitle: '100 दिन की मेहनत, पूरे साल की पहचान! आज की तैयारी • कल की सफलता — Physics, Chemistry, Mathematics & Biology complete target preparation.',
    badge: '🎯 100 DAYS TARGET BATCH',
    buttonText: 'Join Target Batch',
    imageUrl: '/posters/target-batch-100-days-banner.jpg',
    linkUrl: '/courses',
    isActive: true,
    order: 1,
  },
  {
    id: 'official_poster_2',
    title: 'CLASS 11th SPECIAL BATCH — मात्र 90 दिनों में पूरा सिलेबस',
    subtitle: 'Physics • Chemistry • Maths • Biology | प्रतिदिन 5 घंटे की क्लास + Sunday Morning Test & Evening Class शहजाद सर और SIDDHANT BHAIYAA के कुशल नेतृत्व में।',
    badge: '⚡ CLASS 11th SPECIAL BATCH',
    buttonText: 'Explore Class 11 Batch',
    imageUrl: '/posters/class-11-special-batch-1.jpg',
    linkUrl: '/courses',
    isActive: true,
    order: 2,
  },
  {
    id: 'official_poster_3',
    title: 'Chapter-wise TEST Series — Every Saturday & Sunday (Timing 4:00 से 6:00)',
    subtitle: 'Board Exam जैसा अनुभव! Board Pattern Based Test, Detailed Analysis & Performance Improvement at Gali No. 20, Ganga Nagar, Rajapur, Prayagraj.',
    badge: '📝 WEEKEND CHAPTER-WISE TEST',
    buttonText: 'Join Test Series',
    imageUrl: '/posters/chapter-wise-weekend-test.jpg',
    linkUrl: '/courses',
    isActive: true,
    order: 3,
  },
  {
    id: 'official_poster_4',
    title: 'TARGET BATCH — 100 दिन की मेहनत, पूरे साल की पहचान!',
    subtitle: 'UP Board • CBSE Board • JEE Mains | आज की तैयारी • कल की सफलता — Complete 100-Day Intensive Revision & Practice Batch.',
    badge: '🔥 100 DAYS INTENSIVE',
    buttonText: 'Enroll in Target Batch',
    imageUrl: '/posters/target-batch-100-days-poster.jpg',
    linkUrl: '/courses',
    isActive: true,
    order: 4,
  },
  {
    id: 'official_poster_5',
    title: 'SID ACADEMY PRAYAGRAJ — Class 11th Special Batch (90 Days Full Syllabus)',
    subtitle: 'कमजोर छात्रों पर विशेष ध्यान | प्रतिदिन 5 घंटे की क्लास + Sunday Morning Test | पता: गली नं. 20 के पास, गंगा नगर, राजापुर, प्रयागराज।',
    badge: '📚 CLASS 11th 90-DAY BATCH',
    buttonText: 'Explore Class 11 Courses',
    imageUrl: '/posters/class-11-special-batch-2.jpg',
    linkUrl: '/courses',
    isActive: true,
    order: 5,
  },
];

const isLegacyPlaceholderBanner = (b) =>
  !b ||
  /Crack Top Tech Interviews/i.test(b.title || '') ||
  /Data Structures, Web Development, and DBMS/i.test(b.subtitle || '') ||
  /Download 100\+ Free Hand-Written Lecture Notes/i.test(b.title || '');

const HomePage = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [banners, setBanners] = useState(OFFICIAL_POSTER_BANNERS);

  const purchasedIdsKey = (user?.purchasedCourses || []).join(',');
  const purchasedSet = useMemo(() => new Set(user?.purchasedCourses || []), [purchasedIdsKey]);

  useEffect(() => {
    if (authLoading) return;
    const fetchCoursesAndBanners = async () => {
      try {
        const [courseRes, bannerRes] = await Promise.allSettled([
          getAllCourses({ limit: 6, excludePurchased: true }),
          getActiveBanners()
        ]);
        if (courseRes.status === 'fulfilled') {
          const coursesList = courseRes.value.data?.data?.courses || courseRes.value.data?.courses || [];
          setCourses(coursesList);
        }
        if (bannerRes.status === 'fulfilled') {
          const bannersList = (bannerRes.value.data?.data?.banners || bannerRes.value.data?.banners || []).filter(
            (b) => !isLegacyPlaceholderBanner(b)
          );
          if (bannersList.length > 0) {
            setBanners(bannersList);
          } else {
            setBanners(OFFICIAL_POSTER_BANNERS);
          }
        }
      } catch (err) {
        console.error('Error loading home data', err);
      }
    };
    fetchCoursesAndBanners();
  }, [authLoading, isAuthenticated, user?.id, purchasedIdsKey]);

  const visibleCourses = useMemo(
    () => courses.filter(c => !purchasedSet.has(c.id || c._id) && !c.isEnrolled),
    [courses, purchasedSet]
  );

  const clientYouTubeVideos = [
    {
      _id: 'yt_chem_06',
      title: 'LEC 06 chemical kinetics FACTOR AFFECTING RATE OF RXN #iit #jee #hindi #upboard #biharboard #mpboard',
      description: 'सबसे आसान भाषा में समझें - Effect of Temp, Concentration, Catalyst, Surface Area on Reaction Rate by SIDD ACADEMY PRAYAGRAJ.',
      videoUrl: 'https://www.youtube.com/watch?v=-StdzdYReuo',
      playlistUrl: 'https://www.youtube.com/playlist?list=PLKsilHHi-1ZQ',
      duration: '33:32',
      isFree: true,
      chapterTitle: 'Class 12 • Chemistry (रासायनिक बलगतिकी)',
      instructor: 'Siddhant Pandey & आकाश सर',
      thumbnailUrl: 'https://img.youtube.com/vi/-StdzdYReuo/hqdefault.jpg',
      notesUrl: 'https://drive.google.com/file/d/1Y9MXq55i-yQL7wkE_Is-vRI7EgL1UkAd/view?usp=drivesdk',
    },
    {
      _id: 'yt_bio_02',
      title: 'LEC 02 पुष्पी पादपो में लैंगिक जनन by आकाश सर #upboard #mpboard #biharboard #boardexam #biology',
      description: 'Basic to Advance: Embryo Sac development, Pollen-Pistil interaction & Double Fertilization by आकाश सर.',
      videoUrl: 'https://www.youtube.com/watch?v=zoi9_ip5Jus',
      playlistUrl: 'https://www.youtube.com/playlist?list=PLRntVCXiEo8E',
      duration: '25:03',
      isFree: true,
      chapterTitle: 'Class 12 • Biology (Sexual Reproduction)',
      instructor: 'आकाश सर (Aakash Sir)',
      thumbnailUrl: 'https://img.youtube.com/vi/zoi9_ip5Jus/hqdefault.jpg',
      notesUrl: 'https://drive.google.com/file/d/1J8GP8hCFVnYz41OHNLlI1Q_xjK-iNLPw/view?usp=drivesdk',
    },
    {
      _id: 'yt_eng_01',
      title: 'conversation use of to और With by आकाश सर #english #englishgrammar #class12 #upboard #boardexam',
      description: 'Spoken English & Board Exam Grammar: Exact rules for using "To" vs "With" in UP Board sentences.',
      videoUrl: 'https://www.youtube.com/watch?v=ocg3NdWP19I',
      playlistUrl: 'https://www.youtube.com/playlist?list=PLfmTzfjwpnzg',
      duration: '7:03',
      isFree: true,
      chapterTitle: 'Class 12 • English Grammar',
      instructor: 'आकाश सर (Aakash Sir)',
      thumbnailUrl: 'https://img.youtube.com/vi/ocg3NdWP19I/hqdefault.jpg',
      notesUrl: 'https://drive.google.com/file/d/1Bl_SJLm_u0Hw08R8hbZDrRFRCiUJkqAm/view?usp=drivesdk',
    },
    {
      _id: 'yt_chem_05',
      title: 'Chemical kinetics LEC 05 question ❓ #chemistry #class12 #neet #jee #upboard #mpboard #biharboard',
      description: 'High yield numericals on Rate Constant, Half Life & Collision Theory for UP Board exams.',
      videoUrl: 'https://www.youtube.com/watch?v=Sf6K38m99_4',
      playlistUrl: 'https://www.youtube.com/playlist?list=PLKsilHHi-1ZQ',
      duration: '29:58',
      isFree: true,
      chapterTitle: 'Class 12 • Chemistry (Numericals)',
      instructor: 'SIDD ACADEMY Faculty',
      thumbnailUrl: 'https://img.youtube.com/vi/Sf6K38m99_4/hqdefault.jpg',
      notesUrl: 'https://drive.google.com/file/d/1Y9MXq55i-yQL7wkE_Is-vRI7EgL1UkAd/view?usp=drivesdk',
    },
    {
      _id: 'yt_bio_01',
      title: 'LEC 01 पुष्पी पादपो में लैंगिक जनन #flowers #biology #basic #class12 #upboard #mpboard #biharboard',
      description: 'Flower Structure, Stamen, Microsporangium, and Pollen Grain development step-by-step by आकाश सर.',
      videoUrl: 'https://www.youtube.com/watch?v=8gYSV8jLw_U',
      playlistUrl: 'https://www.youtube.com/playlist?list=PLRntVCXiEo8E',
      duration: '14:32',
      isFree: true,
      chapterTitle: 'Class 12 • Biology (Flower Morphology)',
      instructor: 'आकाश सर (Aakash Sir)',
      thumbnailUrl: 'https://img.youtube.com/vi/8gYSV8jLw_U/hqdefault.jpg',
      notesUrl: 'https://drive.google.com/file/d/1J8GP8hCFVnYz41OHNLlI1Q_xjK-iNLPw/view?usp=drivesdk',
    },
    {
      _id: 'yt_regular_launch',
      title: 'जो वादा किया उससे निभाना पड़ेगा SID ACADEMY PRAYAGRAJ 💥 जहां आपकी सफलता हमारी जिम्मेदारी 🤩#study',
      description: '20 August नई शुरुआत — Prayagraj Offline & Online Live Batch orientation with Siddhant Pandey & teaching team.',
      videoUrl: 'https://www.youtube.com/watch?v=FDSkBBM1YUs',
      playlistUrl: 'https://www.youtube.com/playlist?list=PLLN2WU1NsA2o',
      duration: '23:29',
      isFree: true,
      chapterTitle: 'SIDD ACADEMY PRAYAGRAJ • Batch Orientation',
      instructor: 'Siddhant Pandey & Team',
      thumbnailUrl: 'https://img.youtube.com/vi/FDSkBBM1YUs/hqdefault.jpg',
      notesUrl: 'https://drive.google.com/file/d/12MA-htvTQ50r9qN7cXPitrzC_4X_T6WF/view?usp=drivesdk',
    },
  ];

  const clientPlaylists = [
    { id: 'PLKsilHHi-1ZQ', title: 'CHEMICAL KINETICS (रासायनिक बलगतिकी)', subject: 'Class 12 Chemistry', videoCount: '11 Videos', thumbVid: 'beRf23GNY9g' },
    { id: 'PLRntVCXiEo8E', title: 'Biology पुष्पी पादपो में लैंगिक जनन', subject: 'Class 12 Biology', videoCount: '2 Videos', thumbVid: '8gYSV8jLw_U' },
    { id: 'PLfmTzfjwpnzg', title: 'ENGLISH GRAMMAR (आकाश सर)', subject: 'Class 12 English', videoCount: '1 Video', thumbVid: 'ocg3NdWP19I' },
    { id: 'PL4DQCiK7p4ZWD80a41vqlZT71zXdas7Pl', title: 'SOLUTION (विलयन)', subject: 'Class 12 Chemistry', videoCount: '12 Videos', thumbVid: 'rGI-Xn1Y8Is' },
    { id: 'PL4DQCiK7p4ZU2pstQafHazLxW32KZUdNU', title: 'ELECTROCHEMISTRY (वैद्युत रसायन)', subject: 'Class 12 Chemistry', videoCount: '10 Videos', thumbVid: 'wCVRhvbmrfI' },
    { id: 'PL4DQCiK7p4ZWWIfRWknHd8zYxGdOCyvip', title: 'Electrostatic (स्थिरवैद्युतिकी)', subject: 'Class 12 Physics', videoCount: '11 Videos', thumbVid: 'RdYgBhQC0iI' },
    { id: 'PLF7wljYwTV-w', title: 'Alcohol, Phenol & Ether', subject: 'Class 12 Organic Chemistry', videoCount: '13 Videos', thumbVid: 'WBBnNd5eHtE' },
    { id: 'PLAx_BGsVQuKc', title: 'BIOMOLECULES (जैव-अणु)', subject: 'Class 12 Chemistry / Bio', videoCount: '6 Videos', thumbVid: 'V7qJ5898TWs' },
    { id: 'PLcVwTmSFyrbw', title: 'Haloalkane and Haloarene', subject: 'Class 12 Organic Chemistry', videoCount: '4 Videos', thumbVid: 'HT9yFl8EqlU' },
    { id: 'PLMAR6dVeMATU', title: 'Electric Current 💡⚡ (वैद्युत धारा)', subject: 'Class 10 & 12 Physics', videoCount: '4 Videos', thumbVid: 'iOi6olyefpE' },
    { id: 'PLLN2WU1NsA2o', title: 'RAY OPTICS (किरण प्रकाशिकी)', subject: 'Class 12 Physics', videoCount: '3 Videos', thumbVid: '8isS-QpPQHM' },
    { id: 'PLFBdKX91EvMA', title: 'BASIC MATHEMATICS (सिद्धांत भैया)', subject: 'Foundation & Class 10-12', videoCount: '4 Videos', thumbVid: 'fguW9O663NM' },
  ];

  return (
    <div>
      <HeroSection />

      {banners.length > 0 && <FeaturedBanners banners={banners} />}

      {/* Target Classes Selection Grid */}
      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '3.5rem 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              अपनी कक्षा चुनें (Select Your Class)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              हिंदी माध्यम एवं NCERT पैटर्न के आधार पर पूर्ण पाठयक्रम
            </p>
          </div>

          <div className="grid-3">
            <Link to="/courses?level=Class%2010" className="card" style={{ padding: '1.75rem', textAlign: 'left', textDecoration: 'none', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'inline-block', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary-dark)', padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Class 10th High School
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>विज्ञान, गणित एवं सामाजिक विज्ञान</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                Board Exam Special Batch: संपूर्ण NCERT समाधान, मॉडल प्रश्न-पत्र और अध्याय-वार टेस्ट सीरीज़।
              </p>
              <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                View Class 10 Courses <FiArrowRight />
              </span>
            </Link>

            <Link to="/courses?level=Class%2011" className="card" style={{ padding: '1.75rem', textAlign: 'left', textDecoration: 'none', borderLeft: '4px solid var(--secondary)' }}>
              <div style={{ display: 'inline-block', backgroundColor: 'var(--secondary-subtle)', color: 'var(--secondary-dark)', padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Class 11th Foundation
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>भौतिकी, रसायन एवं जीव विज्ञान</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                मजबूत नींव (Strong Foundation) के साथ Board एवं प्रतियोगी परीक्षाओं (NEET / JEE) की तैयारी।
              </p>
              <span style={{ color: 'var(--secondary-dark)', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                View Class 11 Courses <FiArrowRight />
              </span>
            </Link>

            <Link to="/courses?level=Class%2012" className="card" style={{ padding: '1.75rem', textAlign: 'left', textDecoration: 'none', borderLeft: '4px solid var(--accent)' }}>
              <div style={{ display: 'inline-block', backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-dark)', padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Class 12th Board Target
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>UP Board 95%+ Target Batch</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                डेली वीडियो लेक्चर्स, विस्तृत हस्तलिखित नोट्स, विगत 10 वर्षों के अनसॉल्व्ड पेपर्स का हल।
              </p>
              <span style={{ color: 'var(--accent-dark)', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                View Class 12 Courses <FiArrowRight />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="section container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              प्रमुख पाठ्यक्रम (Featured Academic Courses)
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: '0.35rem 0 0 0', fontSize: '0.95rem' }}>
              नवीनतम बोर्ड एवं NCERT पाठयक्रम अनुसार तैयार
            </p>
          </div>
          <Link to="/courses" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            सभी कोर्सेज देखें <FiArrowRight />
          </Link>
        </div>

        <div className="grid-3">
          {visibleCourses.map(course => (
            <CourseCard key={course._id || course.id} course={course} />
          ))}
        </div>
      </section>

      {/* YouTube Video Classes Showcase */}
      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '4.5rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', backgroundColor: '#fef2f2', padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid #fecaca' }}>
                <FiYoutube size={18} color="#ef4444" /> OFFICIAL YOUTUBE CHANNEL • @Sidacademyprayagraj
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.4rem 0 0.5rem 0', color: 'var(--text-primary)' }}>
                मुफ्त वीडियो कक्षाएं (Free Video Lectures)
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '680px', fontSize: '0.95rem' }}>
                SIDD ACADEMY प्रयागराज के विशेषज्ञ शिक्षकों द्वारा तैयार वीडियो लेक्चर्स। सीधे देखें या आधिकारिक YouTube चैनल एवं प्लेलिस्ट देखें।
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a 
                href="https://www.youtube.com/@Sidacademyprayagraj" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
              >
                <FiYoutube size={18} /> Visit @Sidacademyprayagraj
              </a>
              <Link to="/courses" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Explore Courses <FiArrowRight />
              </Link>
            </div>
          </div>

          <div className="grid-3">
            {clientYouTubeVideos.map(video => (
              <YouTubeVideoCard key={video._id} video={video} />
            ))}
          </div>

          {/* Official Channel Playlists Showcase */}
          <div style={{ marginTop: '3.5rem', paddingTop: '2.5rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.35rem 0', color: 'var(--text-primary)' }}>
                  आधिकारिक अध्याय-वार प्लेलिस्ट (Official Channel Playlists)
                </h3>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
                  SIDD ACADEMY PRAYAGRAJ चैनल की सभी सत्यापित विषय-वार YouTube प्लेलिस्ट
                </p>
              </div>
              <a
                href="https://www.youtube.com/@Sidacademyprayagraj/playlists"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              >
                <FiYoutube color="#ef4444" /> View All 18 Playlists on YouTube <FiArrowRight size={14} />
              </a>
            </div>

            <div className="grid-4" style={{ gap: '1.25rem' }}>
              {clientPlaylists.map(pl => (
                <a
                  key={pl.id}
                  href={`https://www.youtube.com/playlist?list=${pl.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card"
                  style={{
                    textDecoration: 'none',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                  }}
                >
                  <div style={{ position: 'relative', height: '130px', backgroundColor: '#0f172a' }}>
                    <img
                      src={`https://img.youtube.com/vi/${pl.thumbVid}/hqdefault.jpg`}
                      alt={pl.title}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(15, 23, 42, 0.88)',
                        color: '#fff',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                      }}
                    >
                      ▶ {pl.videoCount}
                    </span>
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                      {pl.subject}
                    </span>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.35 }}>
                      {pl.title}
                    </h4>
                    <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 600, marginTop: 'auto', paddingTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      Open Playlist <FiArrowRight size={12} />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Modular Study Material Banner */}
      <section className="section container" style={{ textAlign: 'center' }}>
        <div style={{ padding: 'clamp(1.75rem, 5vw, 3.5rem) clamp(1.1rem, 4vw, 2rem)', borderRadius: '16px', backgroundColor: 'var(--primary-subtle)', border: '1px solid var(--primary-border)' }}>
          <h2 style={{ fontSize: 'clamp(1.45rem, 4.2vw, 2.25rem)', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '0.85rem' }}>
            हस्तलिखित नोट्स एवं फॉर्मूला PDFs (Modular Notes)
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '650px', margin: '0 auto 2rem auto', lineHeight: 1.7 }}>
            व्यवस्थित संरचना: <strong>Subject &rarr; Chapter &rarr; PDF 1 / PDF 2</strong>। प्रिंट करने योग्य सूत्र, माइंड-मैप्स और बोर्ड परीक्षा के महत्वपूर्ण प्रश्नोत्तर।
          </p>
          <Link to="/notes" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiDownloadCloud /> ओपन मॉड्यूलर नोट्स लाइब्रेरी
          </Link>
        </div>
      </section>

      {/* Why Choose Section */}
      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: '4.5rem 0', borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>विद्यार्थियों का भरोसा Sidd Academy क्यों है?</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.4rem' }}>हमारी विशेषताएं जो आपकी पढ़ाई को बनाती हैं प्रभावी</p>
          </div>
          <div className="grid-4">
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--secondary-subtle)', color: 'var(--secondary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                <FiStar size={28} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>अनुभवी शिक्षक</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>प्रयागराज के शीर्ष शिक्षकों द्वारा विषयवार अध्यापन।</p>
            </div>
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                <FiFileText size={28} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>मॉड्यूलर PDF नोट्स</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>Subject &rarr; Chapter &rarr; PDF 1/2 प्रारूप में स्पष्ट नोट्स।</p>
            </div>
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                <FiVideo size={28} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>HD वीडियो क्लासेज</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>सरल भाषा और विज़ुअल एनिमेशन के साथ अवधारणाएं स्पष्ट।</p>
            </div>
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent-subtle)', color: 'var(--accent-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                <FiCheck size={28} />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>बोर्ड परीक्षा तैयारी</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>विगत वर्षों के अनसॉल्व्ड प्रश्न और मॉडल पेपर्स।</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
