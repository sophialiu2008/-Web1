import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Heart, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Send, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FooterLink {
  name: string;
  href: string;
  action?: (() => void) | null;
}

const footerLinks: {
  about: FooterLink[];
  services: FooterLink[];
  support: FooterLink[];
} = {
  about: [
    { name: '关于我们', href: '#', action: () => alert('关于我们页面即将上线') },
    { name: '我们的团队', href: '#', action: () => alert('团队介绍页面即将上线') },
    { name: '合作伙伴', href: '#', action: () => alert('合作伙伴页面即将上线') },
    { name: '新闻动态', href: '#', action: () => alert('新闻动态页面即将上线') },
  ],
  services: [
    { name: '宠物领养', href: '/pets' },
    { name: '领养流程', href: '/#process' },
    { name: '成功故事', href: '/#stories' },
    { name: '志愿者招募', href: '#', action: () => alert('志愿者招募即将开启，敬请期待！') },
  ],
  support: [
    { name: '常见问题', href: '/#process' },
    { name: '联系我们', href: '/#contact' },
    { name: '隐私政策', href: '/privacy' },
    { name: '服务条款', href: '#', action: () => alert('服务条款页面即将上线') },
  ],
};

export default function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setShowSubscribeDialog(true);
      setEmail('');
      setTimeout(() => {
        setShowSubscribeDialog(false);
      }, 3000);
    }
  };

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
  };

  const handleLinkClick = (e: React.MouseEvent, link: FooterLink) => {
    if (link.action) {
      e.preventDefault();
      link.action();
    } else if (link.href.startsWith('/#')) {
      e.preventDefault();
      scrollToSection(link.href);
    } else if (link.href.startsWith('/')) {
      e.preventDefault();
      navigate(link.href);
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <a 
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="flex items-center gap-2 mb-6 group"
            >
              <div className="p-2 rounded-xl bg-orange-500 group-hover:bg-orange-600 transition-colors">
                <PawPrint className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">宠物领养中心</span>
            </a>
            <p className="text-gray-400 mb-6 leading-relaxed max-w-sm">
              我们致力于为每一只流浪动物找到温暖的家，
              让领养代替购买，用爱点亮每一个生命。
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3">
              <a 
                href="tel:400-888-9999" 
                className="flex items-center gap-3 text-gray-400 hover:text-orange-500 transition-colors"
              >
                <Phone className="w-4 h-4 text-orange-500" />
                <span>400-888-9999</span>
              </a>
              <a 
                href="mailto:adopt@petcenter.com" 
                className="flex items-center gap-3 text-gray-400 hover:text-orange-500 transition-colors"
              >
                <Mail className="w-4 h-4 text-orange-500" />
                <span>adopt@petcenter.com</span>
              </a>
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>北京市朝阳区宠物街88号</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">关于我们</h3>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link)}
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">服务项目</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link)}
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">帮助支持</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link)}
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-10 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold mb-2">订阅我们的动态</h3>
              <p className="text-gray-400 text-sm">
                获取最新的领养信息和宠物护理知识
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  placeholder="输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <button 
                type="submit"
                className="px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                订阅
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span>© {currentYear} 宠物领养中心</span>
              <span className="hidden md:inline">|</span>
              <span className="flex items-center gap-1">
                用
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                打造
              </span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Facebook页面即将上线');
                }}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Instagram页面即将上线');
                }}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Twitter页面即将上线');
                }}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Subscribe Success Dialog */}
      <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              订阅成功！
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-gray-600">
              感谢您的订阅！我们会将最新的领养信息发送到您的邮箱。
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
