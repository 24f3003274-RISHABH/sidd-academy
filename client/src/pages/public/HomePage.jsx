import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiBook, FiVideo, FiFileText, FiStar, FiYoutube, FiArrowRight, FiDownloadCloud } from 'react-icons/fi';
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
      title: 'LEC 06 Chemical Kinetics: Factor Affecting Rate of Rxn #upboard #hindi',
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
      title: 'LEC 02 पुष्पी पादपो में लैंगिक जनन by आकाश सर #upboard #class12 #biology',
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
      title: 'Conversation & Board Grammar: Use of "To" vs "With" by आकाश सर',
      description: 'Spoken English & Board Exam Grammar: Exact rules for using "To" vs "With" in UP Board sentences.',
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
      title: 'Chemical Kinetics LEC 05 Numericals & Question Practice',
      description: 'High yield numericals on Rate Constant, Half Life & Collision Theory for UP Board exams.',
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
      title: 'LEC 01 पुष्पी पादपों में लैंगिक जनन — पुष्प की संरचना',
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
      title: '20 August नई शुरुआत — Regular Class 10th & 12th Batch Launch',
      description: 'Prayagraj Offline & Online Live Batch orientation with Siddhant Pandey & teaching team.',
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

      {/* Target Classes Selection Grid */}
      <section style={{ backgroundColor: '#ffffff', padding: '3.5rem 0', borderBottom: '1px solid var(--border)' }}>
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
            <Link to="/courses" className="card" style={{ padding: '1.75rem', textAlign: 'left', textDecoration: 'none', borderLeft: '4px solid var(--primary)' }}>
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

            <Link to="/courses" className="card" style={{ padding: '1.75rem', textAlign: 'left', textDecoration: 'none', borderLeft: '4px solid var(--secondary)' }}>
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

            <Link to="/courses" className="card" style={{ padding: '1.75rem', textAlign: 'left', textDecoration: 'none', borderLeft: '4px solid var(--accent)' }}>
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
              सत्र 2024-2025 के लिए नवीनतम पाठयक्रम अनुसार तैयार
            </p>
          </div>
          <Link to="/courses" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            सभी कोर्सेज देखें <FiArrowRight />
          </Link>
        </div>

        <div className="grid-3">
          {courses.map(course => (
            <CourseCard key={course._id || course.id} course={course} />
          ))}
        </div>
      </section>

      {/* YouTube Video Classes Showcase */}
      <section style={{ backgroundColor: '#ffffff', padding: '4.5rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#dc2626', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', backgroundColor: '#fef2f2', padding: '0.3rem 0.75rem', borderRadius: '20px', border: '1px solid #fecaca' }}>
                <FiYoutube size={18} color="#ef4444" /> OFFICIAL YOUTUBE CHANNEL • @A2CCENTRE
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.4rem 0 0.5rem 0', color: 'var(--text-primary)' }}>
                मुफ्त वीडियो कक्षाएं (Free Video Lectures)
              </h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, maxWidth: '680px', fontSize: '0.95rem' }}>
                SID ACADEMY प्रयागराज के विशेषज्ञ शिक्षकों द्वारा तैयार वीडियो लेक्चर्स। सीधे देखें या YouTube चैनल पर सब्सक्राइब करें।
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a 
                href="https://www.youtube.com/@A2CCENTRE" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-primary"
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
              >
                <FiYoutube size={18} /> Visit @A2CCENTRE
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
        </div>
      </section>

      {/* Modular Study Material Banner */}
      <section className="section container" style={{ textAlign: 'center' }}>
        <div style={{ padding: '3.5rem 2rem', borderRadius: '16px', backgroundColor: 'var(--primary-subtle)', border: '1px solid var(--primary-border)' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary-dark)', marginBottom: '1rem' }}>
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
      <section style={{ backgroundColor: '#ffffff', padding: '4.5rem 0', borderTop: '1px solid var(--border)' }}>
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
