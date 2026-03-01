import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/userStore';
import type { AdoptionApplication, Booking } from '@/store/userStore';
import { fetchApplications, fetchBookings, fetchFavorites, fetchMyAdoptions } from '@/services/api';
import { pets as mockPets } from '@/data/pets';
import { usePetStore } from '@/store/petStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import StoryModal from '@/components/stories/StoryModal';
import {
  User, Heart, FileText, Calendar, LogOut,
  CheckCircle2, Clock, Home, X, PawPrint, Edit3
} from 'lucide-react';
import ProfileEditModal from '@/components/profile/ProfileEditModal';

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
  const { user, isLoggedIn, logout, favorites, applications, bookings, setApplications, setBookings, toggleFavorite, setFavorites } = useUserStore();
  const { pets: livePets, fetchPets } = usePetStore();
  const [favoritePetsData, setFavoritePetsData] = useState<any[]>([]);
  const [myPets, setMyPets] = useState<any[]>([]);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [sharePetId, setSharePetId] = useState<string | null>(null);

  // Re-fetch applications and bookings from server every time this page mounts
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    const refresh = async () => {
      try {
        const [apps, bks, favs, adoptions] = await Promise.all([
          fetchApplications(user.id),
          fetchBookings(user.id),
          fetchFavorites(user.id),
          fetchMyAdoptions(user.id).catch(() => [])
        ]);
        if (Array.isArray(adoptions)) {
          setMyPets(adoptions);
        }
        if (Array.isArray(favs)) {
          setFavoritePetsData(favs);
          setFavorites(favs.map((p: any) => String(p.id)));
        }
        if (Array.isArray(apps)) {
          const mapped = apps
            .filter((item: any): item is Record<string, unknown> => !!item && typeof item === 'object')
            .map((item: any) => ({
              id: String(item.id ?? ''),
              petId: typeof item.pet_id === 'number' ? item.pet_id : 0,
              petName: typeof item.pet_name === 'string' ? item.pet_name : '未指定',
              status: (typeof item.status === 'string' ? item.status : 'pending') as AdoptionApplication['status'],
              submitDate: typeof item.submit_date === 'string' ? item.submit_date : '',
              updateDate: typeof item.update_date === 'string' ? item.update_date : '',
              notes: typeof item.notes === 'string' ? item.notes : undefined
            } satisfies AdoptionApplication));
          setApplications(mapped);
        }
        if (Array.isArray(bks)) {
          const mapped = bks
            .filter((item: any): item is Record<string, unknown> => !!item && typeof item === 'object')
            .map((item: any) => ({
              id: String(item.id ?? ''),
              petId: typeof item.pet_id === 'number' ? item.pet_id : 0,
              petName: typeof item.pet_name === 'string' ? item.pet_name : '未指定',
              date: typeof item.date === 'string' ? item.date : '',
              time: typeof item.time === 'string' ? item.time : '',
              status: (typeof item.status === 'string' ? item.status : 'pending') as Booking['status']
            } satisfies Booking));
          setBookings(mapped);
        }
      } catch {
        // silently ignore refresh errors, stale data will remain visible
      }
    };
    refresh();
    fetchPets(); // Ensure live pets are fetched to show favorites
  }, [isLoggedIn, user?.id, setApplications, setBookings, fetchPets]);

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

  // Combine live pets from server and mock pets
  const allPets = [...livePets, ...mockPets];
  // Convert favorite IDs to strings to ensure consistent matching whether UUID or mock number ID
  const stringFavorites = favorites.map(String);
  // Use fetched real data if available, otherwise fallback to matching ID
  // Use fetched real data if available, otherwise fallback to matching ID
  const favoritePets = favoritePetsData.length > 0
    ? favoritePetsData.filter((pet: any) => pet !== null)
    : allPets.filter((pet: any) => stringFavorites.includes(String(pet.id)));

  return (
    <div className="min-h-screen bg-warm-gradient">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center relative group cursor-pointer"
                onClick={() => setIsEditProfileOpen(true)}
              >
                {user?.avatar ? (
                  <img src={user.avatar} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-orange-500" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit3 className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-800">{user?.name}</h1>
                  <button onClick={() => setIsEditProfileOpen(true)} className="text-orange-500 hover:text-orange-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-gray-500">{user?.phone} {user?.city ? `· ${user.city}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/profile/my-pets')}
                className="rounded-full"
              >
                <PawPrint className="w-4 h-4 mr-2" />
                我的发布
              </Button>
              <Button
                onClick={() => navigate('/pets/new')}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
              >
                发布宠物
              </Button>
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
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8">
            <TabsTrigger value="my_pets" className="flex items-center gap-2">
              <PawPrint className="w-4 h-4" />
              我的宠物
            </TabsTrigger>
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

          {/* My Pets */}
          <TabsContent value="my_pets">
            {myPets.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPets.map((pet: any) => (
                  <Card key={pet.pet_id} className="overflow-hidden bg-white border-0 shadow-warm hover:shadow-warm-lg transition-all">
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <img src={pet.image || '/images/cat-orange.jpg'} alt={pet.pet_name} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{pet.pet_name}</h3>
                      <p className="text-sm text-gray-500 mb-3">{pet.breed}</p>
                      <div className="flex gap-2 mb-4">
                        <Badge variant="outline" className="text-xs">{pet.age}</Badge>
                        <Badge variant="outline" className="text-xs">{pet.gender === 'male' ? '公' : '母'}</Badge>
                      </div>
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                        onClick={() => {
                          setSharePetId(String(pet.pet_id));
                          setIsStoryModalOpen(true);
                        }}
                      >
                        <Heart className="w-4 h-4 mr-2" /> 分享领养故事
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={PawPrint}
                title="暂无已领养宠物"
                description="去看看待领养的毛孩子们吧"
                actionText="去浏览"
                onAction={() => navigate('/pets')}
              />
            )}
          </TabsContent>

          {/* Favorites */}
          <TabsContent value="favorites">
            {favoritePets.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoritePets.map((pet: any) => (
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
                    <CardContent className="p-4 relative">
                      {pet.status === 'adopted' && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow z-10">
                          已领养
                        </div>
                      )}
                      <h3 className="font-bold text-gray-800">{pet.name}</h3>
                      <p className="text-sm text-gray-500">{pet.breed}</p>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {pet.age}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {pet.gender === 'male' ? '公' : '母'}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 h-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(String(pet.id));
                            setFavoritePetsData((prev: any[]) => prev.filter((p: any) => String(p.id) !== String(pet.id)));
                          }}
                        >
                          <Heart className="w-4 h-4 mr-1 fill-current" /> 取消
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Heart}
                title="暂无收藏"
                description="浏览宠物，收藏你喜欢的"
                actionText="去浏览"
                onAction={() => navigate('/pets')}
              />
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
                        {/* Progress Tracker */}
                        <div className="mt-4 mb-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>提交申请</span>
                            <span>审核中</span>
                            <span>家访安排</span>
                            <span>完成领养</span>
                          </div>
                          <Progress
                            value={
                              app.status === 'pending' ? 25 :
                                app.status === 'reviewing' ? 50 :
                                  app.status === 'home_visit' ? 75 :
                                    app.status === 'approved' || app.status === 'completed' ? 100 : 0
                            }
                            className={`h-2 ${app.status === 'rejected' ? 'bg-red-100' : ''}`}
                            indicatorClassName={
                              app.status === 'rejected' ? 'bg-red-500' :
                                app.status === 'completed' || app.status === 'approved' ? 'bg-green-500' : 'bg-orange-500'
                            }
                          />
                        </div>
                        {app.notes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                            {app.notes}
                          </div>
                        )}
                        {app.status === 'approved' && (
                          <div className="mt-4 flex justify-end">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSharePetId(String(app.petId));
                                setIsStoryModalOpen(true);
                              }}
                              className="text-orange-500 border-orange-200 hover:bg-orange-50 rounded-full"
                            >
                              <Heart className="w-4 h-4 mr-2" /> 去分享故事
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="暂无申请"
                description="提交领养申请，开始你的领养之旅"
                actionText="去申请"
                onAction={() => navigate('/pets')}
              />
            )}
          </TabsContent>

          {/* Bookings */}
          <TabsContent value="bookings">
            {bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking: Booking) => (
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
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            className={
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-600'
                                : booking.status === 'cancelled'
                                  ? 'bg-red-100 text-red-600'
                                  : booking.status === 'expired'
                                    ? 'bg-gray-100 text-gray-500'
                                    : 'bg-yellow-100 text-yellow-600'
                            }
                          >
                            {booking.status === 'confirmed'
                              ? '已确认'
                              : booking.status === 'cancelled'
                                ? '已取消'
                                : booking.status === 'expired'
                                  ? '已过期'
                                  : '待确认'}
                          </Badge>
                          {(booking.status === 'confirmed' || booking.status === 'pending') && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 border-red-200 hover:bg-red-50"
                              onClick={() => {
                                const bookingDate = new Date(`${booking.date}T${booking.time}`);
                                const diffHours = (bookingDate.getTime() - Date.now()) / (1000 * 60 * 60);
                                if (diffHours < 24) {
                                  alert('预约时间不足24小时，无法取消');
                                  return;
                                }
                                // @ts-ignore
                                useUserStore.getState().cancelBooking(String(booking.id));
                              }}
                            >
                              取消预约
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="暂无预约"
                description="预约到店看宠，找到心仪的伙伴"
                actionText="去预约"
                onAction={() => navigate('/pets')}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <StoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        prefillPetId={sharePetId}
      />
      <ProfileEditModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </div>
  );
}
