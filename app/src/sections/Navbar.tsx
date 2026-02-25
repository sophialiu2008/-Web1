import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/store/userStore';
import { PawPrint, Menu, X, ChevronUp, User, Heart, LogOut } from 'lucide-react';

const navLinks = [
  { name: '首页', href: '/' },
  { name: '待领养宠物', href: '/pets' },
  { name: '领养流程', href: '/#process' },
  { name: '成功故事', href: '/#stories' },
  { name: '宠物知识', href: '/blog' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, logout, favorites } = useUserStore();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 100);
      setShowBackToTop(scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    if (href.startsWith('/#')) {
      const sectionId = href.replace('/#', '');
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      navigate(href);
    }
    setIsMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActive = (href: string) => {
    if (href.startsWith('/#')) {
      return location.pathname === '/' && location.hash === href.replace('/', '');
    }
    return location.pathname === href;
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled || location.pathname !== '/'
            ? 'bg-white/95 backdrop-blur-md shadow-warm py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="flex items-center gap-2 group"
            >
              <div className={`p-2 rounded-xl transition-colors duration-300 ${
                isScrolled || location.pathname !== '/' ? 'bg-orange-100' : 'bg-white/20'
              }`}>
                <PawPrint className={`w-6 h-6 transition-colors duration-300 ${
                  isScrolled || location.pathname !== '/' ? 'text-orange-500' : 'text-white'
                }`} />
              </div>
              <span className={`text-xl font-bold transition-colors duration-300 ${
                isScrolled || location.pathname !== '/' ? 'text-gray-800' : 'text-white'
              }`}>
                宠物领养中心
              </span>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(link.href);
                  }}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
                    isScrolled || location.pathname !== '/'
                      ? isActive(link.href)
                        ? 'text-orange-500 bg-orange-50'
                        : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'
                      : isActive(link.href)
                        ? 'text-white bg-white/20'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.name}
                </a>
              ))}
            </div>

            {/* User Actions */}
            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">{user?.name}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-warm-lg py-2 z-50">
                      <a
                        href="/profile"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/profile');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-500"
                      >
                        <User className="w-4 h-4" />
                        个人中心
                      </a>
                      <a
                        href="/profile/my-pets"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/profile/my-pets');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-500"
                      >
                        <PawPrint className="w-4 h-4" />
                        我的发布
                      </a>
                      <a
                        href="/profile"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/profile');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-500"
                      >
                        <Heart className="w-4 h-4" />
                        我的收藏
                        {favorites.length > 0 && (
                          <span className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">
                            {favorites.length}
                          </span>
                        )}
                      </a>
                      <hr className="my-2 border-gray-100" />
                      <button
                        onClick={() => {
                          logout();
                          navigate('/');
                          setShowUserMenu(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-500 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className={`rounded-full ${
                      isScrolled || location.pathname !== '/'
                        ? 'text-gray-600 hover:text-orange-500'
                        : 'text-white hover:text-white hover:bg-white/10'
                    }`}
                  >
                    登录
                  </Button>
                  <Button
                    onClick={() => navigate('/login')}
                    className={`rounded-full px-6 transition-all duration-300 ${
                      isScrolled || location.pathname !== '/'
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'bg-white text-orange-500 hover:bg-white/90'
                    }`}
                  >
                    立即领养
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className={`w-6 h-6 ${isScrolled || location.pathname !== '/' ? 'text-gray-800' : 'text-white'}`} />
              ) : (
                <Menu className={`w-6 h-6 ${isScrolled || location.pathname !== '/' ? 'text-gray-800' : 'text-white'}`} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        <div
          className={`absolute top-20 left-4 right-4 bg-white rounded-2xl shadow-warm-lg p-6 transition-all duration-300 ${
            isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}
        >
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.href);
                }}
                className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-orange-500 bg-orange-50'
                    : 'text-gray-700 hover:text-orange-500 hover:bg-orange-50'
                }`}
              >
                {link.name}
              </a>
            ))}
            
            {isLoggedIn ? (
              <>
                <hr className="my-2 border-gray-100" />
                <a
                  href="/profile"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-xl text-gray-700 hover:text-orange-500 hover:bg-orange-50 font-medium"
                >
                  个人中心
                </a>
                <a
                  href="/profile/my-pets"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/profile/my-pets');
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-xl text-gray-700 hover:text-orange-500 hover:bg-orange-50 font-medium"
                >
                  我的发布
                </a>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium text-left"
                >
                  退出登录
                </button>
              </>
            ) : (
              <Button
                onClick={() => {
                  navigate('/login');
                  setIsMobileMenuOpen(false);
                }}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full"
              >
                登录 / 注册
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-orange-500 text-white shadow-warm-lg flex items-center justify-center transition-all duration-300 hover:bg-orange-600 hover:scale-110 ${
          showBackToTop
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        <ChevronUp className="w-6 h-6" />
      </button>
    </>
  );
}
