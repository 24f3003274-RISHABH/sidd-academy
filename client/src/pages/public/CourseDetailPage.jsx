import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCourseById } from '../../api/courseApi';
import { createOrder, verifyPayment, cancelOrder, failOrder } from '../../api/orderApi';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';
import YouTubeVideoCard from '../../components/video/YouTubeVideoCard';
import VideoModal from '../../components/video/VideoModal';
import toast from 'react-hot-toast';
import { formatPrice, getEffectivePrice } from '../../utils/helpers';
import { 
  FiClock, 
  FiVideo, 
  FiFileText, 
  FiChevronDown, 
  FiChevronUp, 
  FiPlay, 
  FiCalendar, 
  FiLock, 
  FiCheckCircle, 
  FiFolder,
  FiBookOpen
} from 'react-icons/fi';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [previewVideo, setPreviewVideo] = useState(null);
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await getCourseById(id);
        const fetchedCourse = res.data?.data?.course || res.data?.course || res.data?.data || res.data;
        
        if (!fetchedCourse || (!fetchedCourse.id && !fetchedCourse._id)) {
          throw new Error('Course not found');
        }

        setCourse(fetchedCourse);
        
        // Auto expand first subject and chapter by default
        if (fetchedCourse.subjects && fetchedCourse.subjects.length > 0) {
          const firstSubj = fetchedCourse.subjects[0];
          setExpandedSubjects({ [firstSubj.id || firstSubj._id]: true });
          if (firstSubj.chapters && firstSubj.chapters.length > 0) {
            const firstChap = firstSubj.chapters[0];
            setExpandedChapters({ [firstChap.id || firstChap._id]: true });
          }
        }

        // Check if user already purchased or enrolled
        const courseId = fetchedCourse.id || fetchedCourse._id;
        if (fetchedCourse.isEnrolled || (isAuthenticated && (user?.purchasedCourses?.includes(courseId) || user?.role?.toLowerCase() === 'admin'))) {
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

  const toggleSubject = (subId) => {
    setExpandedSubjects(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  const toggleChapter = (chapId) => {
    setExpandedChapters(prev => ({ ...prev, [chapId]: !prev[chapId] }));
  };

  const loadRazorpayScript = () => {
    if (window.Razorpay) return Promise.resolve(true);
    const existingScript = document.querySelector('script[data-razorpay-checkout]');
    if (existingScript) {
      return new Promise((resolve) => {
        existingScript.addEventListener('load', () => resolve(true), { once: true });
        existingScript.addEventListener('error', () => resolve(false), { once: true });
      });
    }
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.dataset.razorpayCheckout = 'true';
      script.async = true;
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

    setPaymentLoading(true);
    setCheckoutMessage('');
    let checkoutOpened = false;
    try {
      const courseId = course.id || course._id;
      const orderRes = await createOrder({ items: [{ itemId: courseId, itemType: 'course' }] });
      const orderData = orderRes.data?.data || orderRes.data;

      // If 100% free course, access is immediately granted on backend
      if (orderData.isFree || orderData.status === 'PAID') {
        toast.success(orderData.message || 'Enrolled for free! Welcome to the course.');
        setPurchased(true);
        navigate(`/student/my-courses`);
        return;
      }

      const { orderId, razorpayOrderId, amount, currency, keyId } = orderData;

      if (!razorpayOrderId) {
        throw new Error('No payment order was created. Please try again.');
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay checkout could not be loaded. Please check your connection and try again.');
      }

      const options = {
        key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amountInPaise ? String(orderData.amountInPaise) : Math.round(Number(amount) * 100).toString(),
        currency: currency || 'INR',
        name: 'Sidd Academy',
        description: `Enrollment in ${course.title}`,
        order_id: razorpayOrderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment verified! Course added to your library.');
            setPurchased(true);
            setPaymentLoading(false);
            navigate(`/student/my-courses`);
          } catch (err) {
            setPaymentLoading(false);
            toast.error(err.response?.data?.message || 'Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#6c63ff'
        },
        modal: {
          escape: true,
          backdropclose: false,
        },
      };

      const paymentObject = new window.Razorpay(options);
      const finishCheckout = () => {
        setPaymentLoading(false);
      };

      paymentObject.on('payment.failed', function (resp) {
        finishCheckout();
        failOrder(orderId).catch(() => {});
        setCheckoutMessage('Payment was declined or failed. You can try again.');
        toast.error(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
      });

      paymentObject.on('modal.ondismiss', async () => {
        finishCheckout();
        try {
          await cancelOrder(orderId);
          setCheckoutMessage('Checkout closed. You can enroll whenever you are ready.');
          toast('Checkout closed. No payment was recorded.', { icon: 'ℹ️' });
        } catch (err) {
          setCheckoutMessage('Checkout closed. You can retry whenever you are ready.');
        }
      });

      paymentObject.open();
      checkoutOpened = true;

      // Safety timeout guard so UI never stays stuck on Processing...
      window.setTimeout(() => {
        finishCheckout();
      }, 60000);
    } catch (err) {
      setPaymentLoading(false);
      // Provide meaningful error messages
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      if (status === 401) {
        toast.error('Your session has expired. Please log in again to enroll.');
        navigate('/login', { state: { from: `/courses/${id}` } });
      } else if (status === 400 && serverMsg?.includes('already enrolled')) {
        toast.success('You are already enrolled in this course!');
        setPurchased(true);
      } else {
        toast.error(serverMsg || err.message || 'Failed to initiate enrollment. Please try again.');
      }
      console.error('[Enroll Error]', err);
    } finally {
      if (!checkoutOpened) setPaymentLoading(false);
    }
  };

  const handleLessonPlay = (lesson, chapterTitle) => {
    // Only allow free lessons to preview. Paid lessons require enrollment.
    const lessonIsFree = lesson.isFree === true || lesson.is_free === true;
    if (!lessonIsFree && !purchased) {
      toast('This lecture is locked. Enroll to watch it.', { icon: '🔒' });
      return;
    }
    const videoUrl = lesson.videoUrl || lesson.video?.youtube_url || lesson.video?.video_url || lesson.video?.videoUrl;
    if (!videoUrl) {
      toast('No video available for this lecture yet.', { icon: 'ℹ️' });
      return;
    }
    setPreviewVideo({
      videoUrl,
      title: lesson.title,
      description: `Class scheduled on ${new Date(lesson.classDate || lesson.created_at || Date.now()).toLocaleDateString()} (${lesson.duration || 60} mins)`,
      chapterTitle: chapterTitle || 'Academic Lecture',
    });
  };

  if (loading) return <Loader fullPage />;
  if (!course) return null;

  const effectivePrice = getEffectivePrice({
    price: course.price,
    discountPrice: course.discountPrice,
    isFree: course.isFree === true,
  });
  const isFree = effectivePrice <= 0;
  const priceLabel = isFree ? 'Free' : formatPrice(effectivePrice);
  const originalPrice = Number(course.price);
  const discountedPrice = Number(course.discountPrice);
  const hasDiscount = Number.isFinite(originalPrice)
    && Number.isFinite(discountedPrice)
    && discountedPrice > 0
    && discountedPrice < originalPrice;
  const subjects = course.subjects || [];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      {/* Header Banner */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '3.5rem 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container grid-2" style={{ alignItems: 'center', gap: '3rem' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-primary">{course.level || 'Class 10'}</span>
              {course.rating && (
                <span className="badge badge-warning" style={{ backgroundColor: 'rgba(255,183,3,0.15)', color: '#ffb703' }}>
                  ★ {course.rating.toFixed(1)} ({course.enrolledStudents || 0} enrolled)
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '2.4rem', marginBottom: '1rem', fontWeight: 800 }}>{course.title}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {course.description}
            </p>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiClock /> {course.duration || '6 Months'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiBookOpen /> {subjects.length} Subjects</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiVideo /> Interactive Live & Recorded Classes</div>
            </div>
          </div>
          <div>
            <div className="card-glass" style={{ padding: '2rem', textAlign: 'center', borderRadius: '16px' }}>
              <img 
                src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'} 
                alt={course.title} 
                style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '10px', marginBottom: '1.5rem' }} 
              />
              <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: isFree ? '#43e97b' : 'var(--primary)', marginBottom: '1.5rem' }}>
                {priceLabel}
                {hasDiscount && (
                  <span style={{ fontSize: '1.1rem', textDecoration: 'line-through', color: 'var(--text-muted)', marginLeft: '0.75rem' }}>
                    {formatPrice(course.price)}
                  </span>
                )}
              </div>
              
              {purchased ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Link to={`/courses/${id}/watch`} className="btn btn-primary btn-full btn-lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <FiPlay /> Watch Video Lectures
                  </Link>
                  <Link to={`/student/my-courses`} className="btn btn-outline btn-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <FiCheckCircle /> Enrolled in My Courses
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button 
                    onClick={handleEnroll} 
                    disabled={paymentLoading}
                    className="btn btn-primary btn-full btn-lg"
                    aria-busy={paymentLoading}
                    style={{ position: 'relative', overflow: 'hidden' }}
                  >
                    {paymentLoading ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span style={{
                          width: '16px', height: '16px',
                          border: '2px solid rgba(255,255,255,0.4)',
                          borderTopColor: '#fff',
                          borderRadius: '50%',
                          display: 'inline-block',
                          animation: 'loader-spin 0.8s linear infinite',
                        }} />
                        Opening Checkout…
                      </span>
                    ) : isFree ? 'Enroll for Free' : `Enroll — ${priceLabel}`}
                  </button>
                  {checkoutMessage && <p role="status" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, textAlign: 'center' }}>{checkoutMessage}</p>}
                  <Link to={`/courses/${id}/watch`} className="btn btn-outline btn-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <FiPlay /> Preview Course Lectures
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Academic Hierarchy & Syllabus Browser */}
      <div className="container" style={{ padding: '3.5rem 0' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Course Syllabus & Academic Hierarchy</h2>
              <p style={{ color: 'var(--text-muted)' }}>
                Structured curriculum from Subjects down to Chapters and Scheduled Classes with video lectures.
              </p>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {subjects.length} Subjects available
            </span>
          </div>

          {subjects.length === 0 ? (
            <div className="card-glass" style={{ padding: '3rem', textAlign: 'center' }}>
              <FiFolder style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3>Curriculum Outline Coming Soon</h3>
              <p style={{ color: 'var(--text-muted)' }}>The instructional staff is currently organizing the subjects and chapters for this course.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {subjects.map((subject, sIdx) => {
                const subId = subject.id || subject._id;
                const isSubExpanded = !!expandedSubjects[subId];
                const chapters = subject.chapters || [];

                return (
                  <div key={subId} className="card-glass" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    {/* Subject Header */}
                    <div 
                      onClick={() => toggleSubject(subId)}
                      style={{ 
                        padding: '1.25rem 1.5rem', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        cursor: 'pointer',
                        backgroundColor: 'var(--bg-muted)',
                        borderBottom: isSubExpanded ? '1px solid var(--border)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '8px', 
                          backgroundColor: 'rgba(108,99,255,0.15)', 
                          color: 'var(--primary)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem'
                        }}>
                          {sIdx + 1}
                        </span>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>{subject.name || subject.title}</h3>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{chapters.length} Chapters</span>
                        </div>
                      </div>
                      <div>
                        {isSubExpanded ? <FiChevronUp /> : <FiChevronDown />}
                      </div>
                    </div>

                    {/* Chapters List */}
                    {isSubExpanded && (
                      <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {chapters.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '0.5rem 0' }}>No chapters uploaded yet for this subject.</p>
                        ) : (
                          chapters.map((chapter, cIdx) => {
                            const chapId = chapter.id || chapter._id;
                            const isChapExpanded = !!expandedChapters[chapId];
                            const classes = chapter.lessons || chapter.dailyClasses || [];

                            return (
                              <div key={chapId} style={{ backgroundColor: 'var(--bg-card, var(--bg-muted))', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <div 
                                  onClick={() => toggleChapter(chapId)}
                                  style={{ 
                                    padding: '1rem 1.25rem', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    cursor: 'pointer',
                                    backgroundColor: 'var(--bg-muted)'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <FiBookOpen style={{ color: 'var(--primary)' }} />
                                    <span style={{ fontWeight: 600 }}>Chapter {cIdx + 1}: {chapter.title}</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({classes.length} Classes)</span>
                                  </div>
                                  {isChapExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                                </div>

                                {isChapExpanded && (
                                  <div style={{ padding: '0.5rem 1.25rem 1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
                                    {classes.length === 0 ? (
                                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Classes will be scheduled soon.</p>
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {classes.map((cls, lIdx) => {
                                          const lessonIsFree = cls.isFree === true || cls.is_free === true;
                                          const isLocked = !purchased && !lessonIsFree;
                                          return (
                                          <div 
                                            key={cls.id || cls._id || lIdx}
                                            style={{ 
                                              display: 'flex', 
                                              justifyContent: 'space-between', 
                                              alignItems: 'center', 
                                              padding: '0.6rem 0.8rem', 
                                              borderRadius: '6px', 
                                              backgroundColor: isLocked ? 'var(--bg-muted)' : 'var(--bg-card)',
                                              border: '1px solid var(--border)',
                                              fontSize: '0.9rem',
                                              opacity: isLocked ? 0.75 : 1,
                                            }}
                                          >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{lIdx + 1}.</span>
                                              <span style={{ fontWeight: 500 }}>{cls.title}</span>
                                              {cls.isLive && (
                                                <span className="badge badge-danger" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>LIVE</span>
                                              )}
                                              {lessonIsFree && !purchased && (
                                                <span style={{ fontSize: '0.7rem', color: '#43e97b', fontWeight: 600, border: '1px solid #43e97b', borderRadius: '4px', padding: '0.05rem 0.35rem' }}>FREE</span>
                                              )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <FiCalendar /> {new Date(cls.classDate || cls.createdAt).toLocaleDateString()}
                                              </span>
                                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <FiClock /> {cls.duration || 60}m
                                              </span>
                                              {isLocked ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                  <FiLock size={13} /> Locked
                                                </span>
                                              ) : purchased ? (
                                                <Link 
                                                  to={`/courses/${id}/watch?lessonId=${cls.id || cls._id}`}
                                                  className="btn btn-primary"
                                                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                                >
                                                  <FiPlay size={12} /> Play in Classroom
                                                </Link>
                                              ) : (
                                                <button 
                                                  onClick={() => handleLessonPlay(cls, chapter.title)}
                                                  className="btn btn-secondary"
                                                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                                >
                                                  <FiPlay size={12} /> Watch Preview
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
