import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { pets } from '@/data/pets';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// Using custom tab implementation, not importing Tabs components
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, Users, PawPrint, FileText, 
  TrendingUp, Eye, Heart, Calendar,
  ArrowUp, ArrowDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line 
} from 'recharts';

// Mock data for charts
const viewData = [
  { name: '周一', views: 120 },
  { name: '周二', views: 180 },
  { name: '周三', views: 150 },
  { name: '周四', views: 220 },
  { name: '周五', views: 280 },
  { name: '周六', views: 350 },
  { name: '周日', views: 320 },
];

const applicationData = [
  { name: '1月', applications: 45 },
  { name: '2月', applications: 52 },
  { name: '3月', applications: 48 },
  { name: '4月', applications: 61 },
  { name: '5月', applications: 55 },
  { name: '6月', applications: 67 },
];

export default function Admin() {
  const navigate = useNavigate();
  const { isLoggedIn, applications, bookings } = useUserStore();
  const { petViews, getPopularPets } = useAnalyticsStore();
  
  const [activeTab, setActiveTab] = useState('dashboard');

  // Check if user is admin (mock check)
  const isAdmin = isLoggedIn; // In real app, check user role

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-warm-gradient flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <LayoutDashboard className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">访问受限</h2>
            <p className="text-gray-600 mb-6">
              您没有权限访问管理后台
            </p>
            <Button
              onClick={() => navigate('/')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
            >
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const popularPets = getPopularPets(5);
  const totalViews = Object.values(petViews).reduce((a, b) => a + b, 0);
  const pendingApplications = applications.filter(a => a.status === 'pending').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;

  const stats = [
    { 
      title: '总浏览量', 
      value: totalViews.toLocaleString(), 
      icon: Eye, 
      change: '+12%',
      trend: 'up'
    },
    { 
      title: '待处理申请', 
      value: pendingApplications.toString(), 
      icon: FileText, 
      change: '+5',
      trend: 'up'
    },
    { 
      title: '待确认预约', 
      value: pendingBookings.toString(), 
      icon: Calendar, 
      change: '-2',
      trend: 'down'
    },
    { 
      title: '收藏总数', 
      value: '1,234', 
      icon: Heart, 
      change: '+8%',
      trend: 'up'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-800">管理后台</span>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'dashboard', name: '数据概览', icon: TrendingUp },
              { id: 'pets', name: '宠物管理', icon: PawPrint },
              { id: 'applications', name: '领养申请', icon: FileText },
              { id: 'bookings', name: '预约管理', icon: Calendar },
              { id: 'users', name: '用户管理', icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    activeTab === item.id
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full rounded-full"
          >
            返回网站
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab === 'dashboard' && '数据概览'}
              {activeTab === 'pets' && '宠物管理'}
              {activeTab === 'applications' && '领养申请'}
              {activeTab === 'bookings' && '预约管理'}
              {activeTab === 'users' && '用户管理'}
            </h1>
          </header>

          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-orange-500" />
                          </div>
                          <div className={`flex items-center gap-1 text-sm ${
                            stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {stat.trend === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            {stat.change}
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.title}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-gray-800 mb-4">本周浏览量</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={viewData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="views" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-gray-800 mb-4">月度申请趋势</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={applicationData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="applications" stroke="#f97316" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Popular Pets */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-800 mb-4">热门宠物</h3>
                  <div className="space-y-4">
                    {popularPets.map((item, index) => {
                      const pet = pets.find(p => p.id === item.petId);
                      if (!pet) return null;
                      return (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                          <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
                            {index + 1}
                          </span>
                          <img
                            src={pet.image}
                            alt={pet.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{pet.name}</h4>
                            <p className="text-sm text-gray-500">{pet.breed}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-orange-500">{item.views}</div>
                            <div className="text-xs text-gray-400">浏览</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'applications' && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {applications.length > 0 ? (
                    applications.map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <PawPrint className="w-6 h-6 text-orange-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">领养申请 - {app.petName}</h4>
                            <p className="text-sm text-gray-500">申请编号: {app.id}</p>
                            <p className="text-xs text-gray-400">
                              提交时间: {new Date(app.submitDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                          app.status === 'approved' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }>
                          {app.status === 'pending' ? '待审核' :
                           app.status === 'approved' ? '已通过' :
                           app.status === 'completed' ? '已完成' : '审核中'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      暂无领养申请
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'bookings' && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {bookings.length > 0 ? (
                    bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">预约看宠 - {booking.petName}</h4>
                            <p className="text-sm text-gray-500">预约编号: {booking.id}</p>
                            <p className="text-sm text-orange-500">
                              {booking.date} {booking.time}
                            </p>
                          </div>
                        </div>
                        <Badge className={
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                          'bg-gray-100 text-gray-600'
                        }>
                          {booking.status === 'pending' ? '待确认' :
                           booking.status === 'confirmed' ? '已确认' : '已取消'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      暂无预约记录
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {(activeTab === 'pets' || activeTab === 'users') && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
                  <LayoutDashboard className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">功能开发中</h3>
                <p className="text-gray-500">该功能即将上线，敬请期待</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
