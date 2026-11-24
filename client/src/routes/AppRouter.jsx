import React, { Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Loader from '../components/common/Loader';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import AdminLayout from '../components/admin/AdminLayout';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../hooks/useAuth';
import {
  FiArrowLeft,
  FiHome,
  FiBook,
  FiFileText,
  FiGrid,
  FiLayers,
  FiSettings,
  FiShoppingBag,
} from 'react-icons/fi';

// Public Pages
const HomePage = lazy(() => import('../pages/public/HomePage'));
const AboutPage = lazy(() => import('../pages/public/AboutPage'));
const CoursesPage = lazy(() => import('../pages/public/CoursesPage'));
const CourseDetailPage = lazy(() => import('../pages/public/CourseDetailPage'));
const CourseVideoWatchPage = lazy(() => import('../pages/public/CourseVideoWatchPage'));
const NotesPage = lazy(() => import('../pages/public/NotesPage'));
const ContactPage = lazy(() => import('../pages/public/ContactPage'));

// Auth Pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));

// Student Pages
const DashboardPage = lazy(() => import('../pages/student/DashboardPage'));
const MyCoursesPage = lazy(() => import('../pages/student/MyCoursesPage'));
const MyNotesPage = lazy(() => import('../pages/student/MyNotesPage'));
const MyOrdersPage = lazy(() => import('../pages/student/MyOrdersPage'));
const ProfilePage = lazy(() => import('../pages/student/ProfilePage'));

// Admin Pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const ManageCourses = lazy(() => import('../pages/admin/ManageCourses'));
const ManageNotes = lazy(() => import('../pages/admin/ManageNotes'));
const ManageVideos = lazy(() => import('../pages/admin/ManageVideos'));
const ManageUsers = lazy(() => import('../pages/admin/ManageUsers'));
const ManageOrders = lazy(() => import('../pages/admin/ManageOrders'));
const ManageBanners = lazy(() => import('../pages/admin/ManageBanners'));
const ManageSubjects = lazy(() => import('../pages/admin/ManageSubjects'));
const ManageChapters = lazy(() => import('../pages/admin/ManageChapters'));
const CurriculumPage = lazy(() => import('../pages/admin/CurriculumPage'));
const ManageClasses = lazy(() => import('../pages/admin/ManageClasses'));

const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const SubpageQuickNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';

  // Hide on root homepage (homepage already has hero + full navbar) and on classroom video player (which has its own dedicated sticky classroom top bar)
  if (location.pathname === '/' || /^\/courses\/[^/]+\/watch\/?$/.test(location.pathname)) return null;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0.6rem 0',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.6rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-sm btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.32rem 0.7rem',
              fontSize: '0.8rem',
            }}
          >
            <FiArrowLeft size={13} /> Back
          </button>
          <Link
            to="/"
            className="btn btn-sm btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.32rem 0.7rem',
              fontSize: '0.8rem',
            }}
          >
            <FiHome size={13} /> Home
          </Link>
          <Link
            to="/courses"
            className="btn btn-sm btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.32rem 0.7rem',
              fontSize: '0.8rem',
            }}
          >
            <FiBook size={13} /> All Courses
          </Link>
          <Link
            to="/notes"
            className="btn btn-sm btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.32rem 0.7rem',
              fontSize: '0.8rem',
            }}
          >
            <FiFileText size={13} /> Notes Library
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isAuthenticated && (
            <>
              <Link
                to="/student/dashboard"
                className="btn btn-sm btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.32rem 0.7rem',
                  fontSize: '0.8rem',
                }}
              >
                <FiGrid size={13} /> Student Dashboard
              </Link>
              <Link
                to="/student/my-courses"
                className="btn btn-sm btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.32rem 0.7rem',
                  fontSize: '0.8rem',
                }}
              >
                <FiBook size={13} /> My Courses
              </Link>
              <Link
                to="/student/notes"
                className="btn btn-sm btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.32rem 0.7rem',
                  fontSize: '0.8rem',
                }}
              >
                <FiFileText size={13} /> My Notes
              </Link>
              <Link
                to="/student/orders"
                className="btn btn-sm btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.32rem 0.7rem',
                  fontSize: '0.8rem',
                }}
              >
                <FiShoppingBag size={13} /> Orders
              </Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link
                to="/admin/courses"
                className="btn btn-sm btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.32rem 0.75rem',
                  fontSize: '0.8rem',
                }}
              >
                <FiSettings size={13} /> Manage Courses & Playlists
              </Link>
              <Link
                to="/admin/curriculum"
                className="btn btn-sm btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.32rem 0.75rem',
                  fontSize: '0.8rem',
                }}
              >
                <FiLayers size={13} /> Course Studio
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const PublicLayout = ({ children }) => (
  <div className="page-wrapper">
    <Navbar />
    <SubpageQuickNav />
    {children}
    <Footer />
  </div>
);

const AppRouter = () => {
  return (
    <Suspense fallback={<Loader fullPage />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
        <Route path="/courses" element={<PublicLayout><CoursesPage /></PublicLayout>} />
        <Route path="/courses/:id" element={<PublicLayout><CourseDetailPage /></PublicLayout>} />
        <Route path="/courses/:id/watch" element={<PublicLayout><CourseVideoWatchPage /></PublicLayout>} />
        <Route path="/notes" element={<PublicLayout><NotesPage /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />

        {/* Auth Routes */}
        <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
        <Route path="/register" element={<PublicLayout><RegisterPage /></PublicLayout>} />

        {/* Student Routes */}
        <Route path="/student/dashboard" element={<ProtectedRoute><PublicLayout><DashboardPage /></PublicLayout></ProtectedRoute>} />
        <Route path="/student/my-courses" element={<ProtectedRoute><PublicLayout><MyCoursesPage /></PublicLayout></ProtectedRoute>} />
        <Route path="/student/notes" element={<ProtectedRoute><PublicLayout><MyNotesPage /></PublicLayout></ProtectedRoute>} />
        <Route path="/student/orders" element={<ProtectedRoute><PublicLayout><MyOrdersPage /></PublicLayout></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute><PublicLayout><ProfilePage /></PublicLayout></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="curriculum" element={<CurriculumPage />} />
          <Route path="courses" element={<ManageCourses />} />
          <Route path="subjects" element={<ManageSubjects />} />
          <Route path="chapters" element={<ManageChapters />} />
          <Route path="classes" element={<ManageClasses />} />
          <Route path="videos" element={<ManageVideos />} />
          <Route path="notes" element={<ManageNotes />} />
          <Route path="banners" element={<ManageBanners />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="orders" element={<ManageOrders />} />
        </Route>

        <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
