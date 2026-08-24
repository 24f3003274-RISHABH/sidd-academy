import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourseById } from '../../api/courseApi';
import { createOrder, verifyPayment } from '../../api/paymentApi';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';
import YouTubeVideoCard from '../../components/video/YouTubeVideoCard';
import VideoModal from '../../components/video/VideoModal';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/helpers';
import { FiClock, FiVideo, FiFileText, FiBookOpen, FiPlayCircle, FiExternalLink } from 'react-icons/fi';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await getCourseById(id);
        setCourse(res.data.course);
        // Check if user already purchased
        if (isAuthenticated && user?.purchasedCourses?.includes(id)) {
          setPurchased(true);
        }
      } catch (err) {
        toast.error('Course not found');
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id, isAuthenticated, user, navigate]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    if (course.isFree) {
      toast.success('Enrolled for free!');
      navigate(`/student/my-courses`);
      return;
    }

    setPaymentLoading(true);
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error('Razorpay SDK failed to load');
        return;
      }

      // Create order
      const orderRes = await createOrder({ items: [{ itemId: id, type: 'course', price: course.price }] });
      const { orderId, amount, currency } = orderRes.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: amount.toString(),
        currency,
        name: 'Sidd Academy',
        description: `Enroll in ${course.title}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful!');
            setPurchased(true);
            navigate(`/student/my-courses`);
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: '#6c63ff'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      toast.error('Failed to initiate payment');
      console.error(err);
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) return <Loader fullPage />;
  if (!course) return null;

  return (
    <div>
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '3.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container grid-2" style={{ alignItems: 'center', gap: '3rem' }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '1rem', display: 'inline-block' }}>{course.level}</span>
            <h1 style={{ fontSize: '2.4rem', marginBottom: '1rem', fontWeight: 800 }}>{course.title}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>{course.description}</p>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiClock /> {course.totalDuration || 'Flexible'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiVideo /> {course.totalLessons || '100+'} Video Lectures</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiFileText /> Modular PDF Notes</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {course.instructor?.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{course.instructor}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Course Master & Faculty</div>
              </div>
            </div>
          </div>
          <div>
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center', borderRadius: '16px' }}>
              <img src={course.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80'} alt={course.title} style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '10px', marginBottom: '1.5rem' }} />
              <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: course.isFree ? '#43e97b' : 'var(--primary)', marginBottom: '1.5rem' }}>
                {course.isFree ? 'Free' : formatPrice(course.discountPrice || course.price)}
              </div>
              
              {purchased ? (
                <Link to={`/student/my-courses`} className="btn btn-primary btn-full btn-lg">Go to Course Content</Link>
              ) : (
                <button 
                  onClick={handleEnroll} 
                  disabled={paymentLoading}
                  className="btn btn-primary btn-full btn-lg"
                >
                  {paymentLoading ? 'Processing...' : course.isFree ? 'Enroll for Free' : 'Enroll Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Curriculum & Video Lecture Previews */}
      <div className="container" style={{ padding: '4rem 0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Course Curriculum & Video Lectures</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Click any lecture thumbnail to stream the video lecture directly or open on YouTube.
            </p>
          </div>

          {/* Sample Interactive Video Lecture Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <YouTubeVideoCard
              video={{
                _id: `${course._id}_demo1`,
                title: 'Orientation & Chapter 1 Concept Breakdown',
                description: 'Key fundamental concepts and problem-solving blueprint.',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: '45 mins',
                isFree: true,
                chapterTitle: 'Module 1',
                notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              }}
            />
            <YouTubeVideoCard
              video={{
                _id: `${course._id}_demo2`,
                title: 'Advanced Theorem Proofs & Step-by-Step Practice',
                description: 'Board examination high-yield questions with full derivations.',
                videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duration: '52 mins',
                isFree: true,
                chapterTitle: 'Module 2',
                notesUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
              }}
            />
          </div>
        </div>
      </div>

      {previewVideo && (
        <VideoModal
          isOpen={!!previewVideo}
          onClose={() => setPreviewVideo(null)}
          videoUrl={previewVideo.videoUrl}
          title={previewVideo.title}
          description={previewVideo.description}
          chapterTitle={previewVideo.chapterTitle}
        />
      )}
    </div>
  );
};

export default CourseDetailPage;
