import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Toaster } from 'sonner';
import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import PetGallery from './sections/PetGallery';
import AdoptionProcess from './sections/AdoptionProcess';
import SuccessStories from './sections/SuccessStories';
import AdoptionForm from './sections/AdoptionForm';
import Footer from './sections/Footer';
import ChatWidget from './components/chat/ChatWidget';
import NearbyPets from './sections/NearbyPets';
import CompareFloatBar from './components/compare/CompareFloatBar';
import PetCompare from './components/compare/PetCompare';
import SEO from '@/components/SEO';

// Lazy loaded pages for better performance
const PetDetail = lazy(() => import('./pages/PetDetail'));
const Pets = lazy(() => import('./pages/Pets'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Privacy = lazy(() => import('./pages/Privacy'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const PetsNew = lazy(() => import('./pages/PetsNew'));
const MyPets = lazy(() => import('./pages/MyPets'));

// Admin Pages
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/Admin/Overview'));
const UserManagement = lazy(() => import('./pages/Admin/Users'));
const ApplicationManagement = lazy(() => import('./pages/Admin/Applications'));
const BookingManagement = lazy(() => import('./pages/Admin/Bookings'));
const PetManagement = lazy(() => import('./pages/Admin/Pets'));
const StoryModeration = lazy(() => import('./pages/Admin/Stories'));

// Loading component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center animate-pulse">
          <span className="text-2xl">🐾</span>
        </div>
        <p className="text-gray-500">加载中...</p>
      </div>
    </div>
  );
}

// Analytics tracker component
function AnalyticsTracker() {
  const location = useLocation();
  const { trackPageView } = useAnalyticsStore();

  useEffect(() => {
    trackPageView(location.pathname + (location.hash || ''));
    if (location.hash && location.hash.length > 1) {
      const id = location.hash.slice(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location, trackPageView]);

  return null;
}

// Home page component
function HomePage() {
  return (
    <>
      <SEO />
      <section id="hero">
        <Hero />
      </section>
      <PetGallery />
      <NearbyPets />
      <AdoptionProcess />
      <SuccessStories />
      <AdoptionForm />
    </>
  );
}

// Layout component for pages with navbar and footer
function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
      <Footer />
      <ChatWidget />
      <CompareFloatBar />
      <PetCompare />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Toaster richColors position="top-center" />
      <AnalyticsTracker />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Home Page */}
          <Route
            path="/"
            element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            }
          />

          {/* Pet Pages */}
          <Route
            path="/pets"
            element={
              <MainLayout>
                <Pets />
              </MainLayout>
            }
          />
          <Route
            path="/pets/new"
            element={
              <MainLayout>
                <PetsNew />
              </MainLayout>
            }
          />
          <Route
            path="/pet/:id"
            element={
              <MainLayout>
                <PetDetail />
              </MainLayout>
            }
          />

          {/* Blog Pages */}
          <Route
            path="/blog"
            element={
              <MainLayout>
                <Blog />
              </MainLayout>
            }
          />
          <Route
            path="/blog/:id"
            element={
              <MainLayout>
                <BlogDetail />
              </MainLayout>
            }
          />

          {/* User Pages */}
          <Route
            path="/profile"
            element={
              <MainLayout>
                <Profile />
              </MainLayout>
            }
          />
          <Route
            path="/profile/my-pets"
            element={
              <MainLayout>
                <MyPets />
              </MainLayout>
            }
          />
          <Route
            path="/login"
            element={<Login />}
          />
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />
          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* Legal Pages */}
          <Route
            path="/privacy"
            element={
              <MainLayout>
                <Privacy />
              </MainLayout>
            }
          />

          {/* Temporary Debug Route — remove after debugging */}
          <Route path="/debug-user" element={
            <pre style={{ padding: 24, fontSize: 14 }}>{JSON.stringify(
              (() => { try { const raw = localStorage.getItem('user-storage'); return raw ? JSON.parse(raw) : 'No user-storage in localStorage'; } catch (e) { return String(e); } })(),
              null, 2
            )}</pre>
          } />

          {/* Admin Pages */}
          <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
          <Route path="/admin/overview" element={<AdminLayout><AdminOverview /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><UserManagement /></AdminLayout>} />
          <Route path="/admin/applications" element={<AdminLayout><ApplicationManagement /></AdminLayout>} />
          <Route path="/admin/bookings" element={<AdminLayout><BookingManagement /></AdminLayout>} />
          <Route path="/admin/pets" element={<AdminLayout><PetManagement /></AdminLayout>} />
          <Route path="/admin/stories" element={<AdminLayout><StoryModeration /></AdminLayout>} />

          {/* 404 Page */}
          <Route
            path="*"
            element={
              <MainLayout>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-4xl">🐕</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">404</h1>
                    <p className="text-gray-600 mb-6">哎呀，页面跑丢了</p>
                    <a
                      href="/"
                      className="inline-block px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
                    >
                      返回首页
                    </a>
                  </div>
                </div>
              </MainLayout>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
