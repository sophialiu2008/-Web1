import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { pets } from '@/data/pets';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  User, Heart, FileText, Calendar, LogOut, 
  CheckCircle2, Clock, Home, X, PawPrint 
} from 'lucide-react';

const statusMap: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-600', icon: Clock },
  reviewing: { label: '审核中', color: 'bg-blue-100 text-blue-600', icon: FileText },
  home_visit: { label: '家访中', color: 'bg-purple-100 text-purple-600', icon: Home },
  approved: { label: '已通过', color: 'bg-green-100 text-green-600', icon: CheckCircle2 },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600', icon: CheckCircle2 },
  rejected: { label: '未通过', color: 'bg-red-100 text-red-600', icon: X },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout, favorites, applications, bookings } = useUserStore();
  // const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-warm-gradient flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-100 flex items-center justify-center">
              <User className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">请先登录</h2>
            <p className="text-gray-600 mb-6">
              登录后可以查看您的收藏、申请记录和预约信息
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
            >
              去登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const favoritePets = pets.filter((pet) => favorites.includes(pet.id));

  return (
    <div className="min-h-screen bg-warm-gradient">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{user?.name}</h1>
                <p className="text-gray-500">{user?.phone}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="rounded-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              我的收藏
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              领养申请
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              我的预约
            </TabsTrigger>
          </TabsList>

          {/* Favorites */}
          <TabsContent value="favorites">
            {favoritePets.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritePets.map((pet) => (
                  <Card
                    key={pet.id}
                    className="overflow-hidden cursor-pointer hover:shadow-warm-lg transition-all"
                    onClick={() => navigate(`/pet/${pet.id}`)}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={pet.image}
                        alt={pet.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-gray-800">{pet.name}</h3>
                      <p className="text-sm text-gray-500">{pet.breed}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {pet.age}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {pet.gender === 'male' ? '公' : '母'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">暂无收藏</h3>
                <p className="text-gray-500 mb-6">浏览宠物，收藏你喜欢的</p>
                <Button
                  onClick={() => navigate('/pets')}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                >
                  去浏览
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Applications */}
          <TabsContent value="applications">
            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => {
                  const status = statusMap[app.status];
                  const StatusIcon = status.icon;
                  return (
                    <Card key={app.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                              <PawPrint className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800">
                                领养申请 - {app.petName}
                              </h3>
                              <p className="text-sm text-gray-500">
                                申请编号: {app.id}
                              </p>
                              <p className="text-xs text-gray-400">
                                提交时间: {new Date(app.submitDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        {app.notes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                            {app.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">暂无申请</h3>
                <p className="text-gray-500 mb-6">提交领养申请，开始你的领养之旅</p>
                <Button
                  onClick={() => navigate('/pets')}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                >
                  去申请
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Bookings */}
          <TabsContent value="bookings">
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-800">
                              预约看宠 - {booking.petName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              预约编号: {booking.id}
                            </p>
                            <p className="text-sm text-orange-500">
                              {booking.date} {booking.time}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-600'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-yellow-100 text-yellow-600'
                          }
                        >
                          {booking.status === 'confirmed'
                            ? '已确认'
                            : booking.status === 'cancelled'
                            ? '已取消'
                            : '待确认'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">暂无预约</h3>
                <p className="text-gray-500 mb-6">预约到店看宠，找到心仪的伙伴</p>
                <Button
                  onClick={() => navigate('/pets')}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                >
                  去预约
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
