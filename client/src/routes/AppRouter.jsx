import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Loader from '../components/common/Loader';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import AdminLayout from '../components/admin/AdminLayout';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

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
const ManageClasses = lazy(() => import('../pages/admin/ManageClasses'));

const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

const PublicLayout = ({ children }) => (
  <div className="page-wrapper">
    <Navbar />
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
        <Route path="/student/orders" element={<ProtectedRoute><PublicLayout><MyOrdersPage /></PublicLayout></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute><PublicLayout><ProfilePage /></PublicLayout></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
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
