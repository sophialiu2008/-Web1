import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import PetGallery from './sections/PetGallery';
import AdoptionProcess from './sections/AdoptionProcess';
import SuccessStories from './sections/SuccessStories';
import AdoptionForm from './sections/AdoptionForm';
import Footer from './sections/Footer';
import ChatWidget from './components/chat/ChatWidget';

// Lazy loaded pages for better performance
const PetDetail = lazy(() => import('./pages/PetDetail'));
const Pets = lazy(() => import('./pages/Pets'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Admin = lazy(() => import('./pages/Admin'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

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
      <section id="hero">
        <Hero />
      </section>
      <PetGallery />
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
    </div>
  );
}

function App() {
  return (
    <Router>
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
          
          {/* Admin Pages */}
          <Route
            path="/admin"
            element={<Admin />}
          />
          
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
