import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { pets as mockPets } from '@/data/pets';
import { useUserStore } from '@/store/userStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { usePetStore } from '@/store/petStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Heart, MapPin, Search, X, Dog, Cat, Filter,
  Sparkles, BarChart2, Map, LayoutGrid, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PetQuiz from '@/components/quiz/PetQuiz';
import MapContainer from '@/components/map/MapContainer';
import SEO from '@/components/SEO';

const CATEGORIES = [
  { id: 'all', name: '全部', icon: Filter },
  { id: 'dog', name: '狗狗', icon: Dog },
  { id: 'cat', name: '猫咪', icon: Cat },
];

export default function Pets() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { favorites, toggleFavorite, compareList, setCompareOpen } = useUserStore();
  const { trackSearch } = useAnalyticsStore();
  const { pets: livePets, fetchPets, isLoading } = usePetStore();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const [filters, setFilters] = useState({ gender: '', age: '', breed: '', city: '', sort: 'newest' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    const params: any = {};
    if (activeFilter !== 'all') params.category = activeFilter;
    if (searchQuery.trim()) params.q = searchQuery;
    if (filters.gender) params.gender = filters.gender;
    if (filters.age) params.age = filters.age;
    if (filters.city) params.city = filters.city;
    if (filters.breed) params.breed = filters.breed;
    if (filters.sort) params.sort = filters.sort;

    const timer = setTimeout(() => {
      fetchPets({ ...params, force: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchPets, activeFilter, searchQuery, filters]);

  useEffect(() => {
    const filterFromUrl = searchParams.get('category');
    if (filterFromUrl && CATEGORIES.some(c => c.id === filterFromUrl)) {
      setActiveFilter(filterFromUrl);
    }
  }, [searchParams]);

  const allPets = useMemo(() => {
    return [...livePets, ...mockPets];
  }, [livePets]);

  const filteredPets = useMemo(() => {
    let result = allPets.filter(p => p.status !== 'adopted');

    if (activeFilter !== 'all') {
      result = result.filter(pet => pet.type === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(pet =>
        pet.name.toLowerCase().includes(query) ||
        pet.breed.toLowerCase().includes(query) ||
        pet.location.toLowerCase().includes(query) ||
        pet.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (showFavoritesOnly) {
      result = result.filter(pet => favorites.includes(String(pet.id)));
    }

    if (filters.gender) {
      result = result.filter(pet => pet.gender === filters.gender);
    }
    if (filters.breed) {
      result = result.filter(pet => pet.breed.toLowerCase().includes(filters.breed.toLowerCase()));
    }
    if (filters.city) {
      result = result.filter(pet => pet.location?.includes(filters.city) || (pet as any).city?.includes(filters.city));
    }
    if (filters.age) {
      result = result.filter(p => {
        const ageYears = (p as any).age_years !== undefined ? (p as any).age_years : parseInt(p.age || '1');
        if (filters.age === 'baby') return ageYears <= 1;
        if (filters.age === 'young') return ageYears > 1 && ageYears <= 3;
        if (filters.age === 'adult') return ageYears > 3 && ageYears <= 8;
        if (filters.age === 'senior') return ageYears > 8;
        return true;
      });
    }

    if (filters.sort === 'oldest') {
      result = result.sort((a, b) => new Date(a.arrivalDate || '2000').getTime() - new Date(b.arrivalDate || '2000').getTime());
    } else {
      result = result.sort((a, b) => new Date(b.arrivalDate || '2000').getTime() - new Date(a.arrivalDate || '2000').getTime());
    }

    return result;
  }, [allPets, activeFilter, searchQuery, showFavoritesOnly, favorites, filters]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      trackSearch(value);
    }
  };

  return (
    <div className="min-h-screen bg-warm-gradient">
      <SEO
        title="宠物图鉴 - 发现待领养的可爱动物"
        description="浏览成百上千只等待领养的狗狗和猫咪，根据品种、年龄、城市等多维度寻找最适合你的小宠物。"
      />
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">待领养宠物</h1>
              <p className="text-gray-600">
                共 {filteredPets.length} 只可爱的宠物在等待新家
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowQuiz(true)}
                className="rounded-full border-orange-200 text-orange-500 hover:bg-orange-50"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                宠物匹配测试
              </Button>
              {compareList.length > 0 && (
                <Button
                  onClick={() => setCompareOpen(true)}
                  className="rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  对比 ({compareList.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="搜索宠物名字、品种、地点..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 pr-10 py-3 rounded-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            className={`rounded-full px-6 transition-colors ${showAdvancedFilters ? 'bg-orange-50 text-orange-600 border-orange-200' : 'text-gray-600'}`}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            高级筛选
            {Object.values(filters).filter(v => v && v !== 'newest').length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                {Object.values(filters).filter(v => v && v !== 'newest').length}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-300 ${showAdvancedFilters ? 'rotate-180' : ''}`} />
          </Button>

          <div className="flex justify-center gap-2 flex-wrap">
            {CATEGORIES.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-colors z-10 ${isActive
                    ? 'text-white'
                    : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-500'
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 bg-orange-500 rounded-full shadow-warm z-[-1]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4" />
                  {filter.name}
                </button>
              );
            })}

            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all ${showFavoritesOnly
                ? 'bg-red-500 text-white shadow-warm'
                : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-500'
                }`}
            >
              <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-white' : ''}`} />
              我的收藏
              {favorites.length > 0 && (
                <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${showFavoritesOnly ? 'bg-white/20' : 'bg-red-100 text-red-600'
                  }`}>
                  {favorites.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <Card className="bg-white/50 backdrop-blur-sm border-0 shadow-sm rounded-2xl">
                <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <Select value={filters.gender} onValueChange={(v) => setFilters({ ...filters, gender: v === 'all' ? '' : v })}>
                    <SelectTrigger className="rounded-full bg-white"><SelectValue placeholder="性别" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">不限性别</SelectItem>
                      <SelectItem value="male">公</SelectItem>
                      <SelectItem value="female">母</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.age} onValueChange={(v) => setFilters({ ...filters, age: v === 'all' ? '' : v })}>
                    <SelectTrigger className="rounded-full bg-white"><SelectValue placeholder="年龄段" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">不限年龄</SelectItem>
                      <SelectItem value="baby">幼年 (1岁及以下)</SelectItem>
                      <SelectItem value="young">青年 (1-3岁)</SelectItem>
                      <SelectItem value="adult">成年 (3-8岁)</SelectItem>
                      <SelectItem value="senior">老年 (8岁以上)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="品种 (例如: 金毛)"
                    value={filters.breed}
                    onChange={(e) => setFilters({ ...filters, breed: e.target.value })}
                    className="rounded-full bg-white"
                  />
                  <Input
                    placeholder="城市 (例如: 北京)"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    className="rounded-full bg-white"
                  />

                  <Select value={filters.sort} onValueChange={(v) => setFilters({ ...filters, sort: v })}>
                    <SelectTrigger className="rounded-full bg-white border-orange-200 text-orange-600"><SelectValue placeholder="排序" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">最新发布优先</SelectItem>
                      <SelectItem value="oldest">最早发布优先</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            找到 <span className="font-bold text-orange-500">{filteredPets.length}</span> 只宠物
          </p>
          <div className="flex items-center gap-2">
            {(searchQuery || showFavoritesOnly || activeFilter !== 'all' || Object.values(filters).some(v => v && v !== 'newest')) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowFavoritesOnly(false);
                  setActiveFilter('all');
                  setFilters({ gender: '', age: '', breed: '', city: '', sort: 'newest' });
                }}
                className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                清除筛选
              </button>
            )}
            <div className="flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="列表视图"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-full transition-all ${viewMode === 'map' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                title="地图视图"
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-0 py-0">
          {viewMode === 'map' ? (
            <div className="bg-white rounded-2xl shadow-warm p-4">
              <MapContainer
                key="pets-map-view"
                height="600px"
                zoom={5}
                center={[104.0, 35.5]}
                markers={filteredPets
                  .filter(p => p.latitude && p.longitude)
                  .map(pet => ({
                    position: [pet.longitude!, pet.latitude!] as [number, number],
                    title: pet.name,
                    content: `<div style="padding:8px;min-width:180px;cursor:pointer;" onclick="window.location.href='/pet/${pet.id}'">
                      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <img src="${pet.image}" style="width:48px;height:48px;border-radius:8px;object-fit:cover;" onerror="this.src='/images/cat-orange.jpg'" />
                        <div>
                          <div style="font-weight:bold;font-size:14px;">${pet.name}</div>
                          <div style="color:#666;font-size:12px;">${pet.breed}</div>
                        </div>
                      </div>
                      <div style="font-size:12px;color:#999;">${pet.location}</div>
                    </div>`,
                  }))}
                fitView
              />
              {filteredPets.filter(p => p.latitude && p.longitude).length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-4">暂无宠物有位置信息，新发布的宠物选择地图定位后将显示在地图上</p>
              )}
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-[380px]">
                  <Skeleton className="w-full aspect-[3/4] rounded-none" />
                  <div className="p-5 flex flex-col gap-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2 mt-auto">
                      <Skeleton className="h-6 w-16 rounded-md" />
                      <Skeleton className="h-6 w-16 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPets.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredPets.map((pet, index) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    key={pet.id}
                  >
                    <Card
                      className="group overflow-hidden bg-white border-0 shadow-warm hover:shadow-warm-lg transition-all duration-500 hover:-translate-y-2 cursor-pointer h-full"
                      onClick={() => navigate(`/pet/${pet.id}`)}
                    >
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img
                          src={pet.image}
                          alt={pet.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(String(pet.id));
                            }}
                            className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110"
                          >
                            <Heart
                              className={`w-5 h-5 transition-colors ${favorites.includes(String(pet.id))
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-400'
                                }`}
                            />
                          </button>
                        </div>

                        <div className="absolute top-3 left-3">
                          <Badge className={`${pet.type === 'dog'
                            ? 'bg-blue-500/90 text-white'
                            : 'bg-pink-500/90 text-white'
                            }`}>
                            {pet.type === 'dog' ? '狗狗' : '猫咪'}
                          </Badge>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-sm line-clamp-2">{pet.description}</p>
                        </div>
                      </div>

                      <CardContent className="p-5 flex flex-col justify-between h-[calc(100%-75%)]">
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-800 mb-1">{pet.name}</h3>
                              <p className="text-sm text-gray-500">{pet.breed}</p>
                            </div>
                            <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">
                              {pet.age}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {pet.location.split('市')[0]}
                            </span>
                            <span className="flex items-center gap-1">
                              {pet.gender === 'male' ? '♂' : '♀'}
                              {pet.gender === 'male' ? '公' : '母'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-auto">
                          {pet.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                          {pet.tags.length > 2 && (
                            <span className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600">
                              +{pet.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <EmptyState
              icon={Search}
              title="没有找到匹配的宠物"
              description="试试其他搜索词或筛选条件"
              actionText="查看全部宠物"
              onAction={() => {
                setSearchQuery('');
                setShowFavoritesOnly(false);
                setActiveFilter('all');
              }}
              className="py-20"
            />
          )}
        </div>
      </main>

      <PetQuiz isOpen={showQuiz} onClose={() => setShowQuiz(false)} />
    </div >
  );
}
