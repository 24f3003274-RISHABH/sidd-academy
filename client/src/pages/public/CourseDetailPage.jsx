import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById } from '../../api/courseApi';
import { createOrder, verifyPayment } from '../../api/paymentApi';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/helpers';
import { FiClock, FiVideo, FiFileText } from 'react-icons/fi';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

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
      // Implement free enroll logic if you have an API for it, or direct to content
      toast.success('Enrolled for free!');
      navigate(`/student/my-courses/${id}`);
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
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // should fetch from API ideally
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
          name: user.name,
          email: user.email,
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
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '3rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container grid-2" style={{ alignItems: 'center', gap: '3rem' }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '1rem', display: 'inline-block' }}>{course.level}</span>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{course.title}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>{course.description}</p>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiClock /> {course.duration || 'Flexible'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiVideo /> Video Lectures</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {course.instructor?.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{course.instructor}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Instructor</div>
              </div>
            </div>
          </div>
          <div>
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center' }}>
              <img src={course.thumbnail || 'https://via.placeholder.com/400x250'} alt={course.title} style={{ width: '100%', height: 'auto', borderRadius: '8px', marginBottom: '1.5rem' }} />
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '1.5rem' }}>
                {course.isFree ? 'Free' : formatPrice(course.price)}
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

      <div className="container" style={{ padding: '4rem 0' }}>
        <div style={{ maxWidth: '800px' }}>
          <h2 style={{ marginBottom: '2rem' }}>Course Syllabus</h2>
          <div className="chapter-tree card-glass" style={{ padding: '2rem' }}>
            {/* Displaying placeholder syllabus if data is not populated. Admin API handles chapter creation. */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiFileText /> Introduction
              </div>
              <div style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
                <p>Welcome to the course and overview.</p>
              </div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2rem' }}>More chapters will be visible upon enrollment.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
