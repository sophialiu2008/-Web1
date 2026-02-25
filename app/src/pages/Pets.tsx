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
import {
  Heart, MapPin, Search, X, Dog, Cat, Filter,
  Sparkles, BarChart2, Map, LayoutGrid
} from 'lucide-react';
import PetQuiz from '@/components/quiz/PetQuiz';
import PetCompare from '@/components/compare/PetCompare';
import MapContainer from '@/components/map/MapContainer';

const CATEGORIES = [
  { id: 'all', name: '全部', icon: Filter },
  { id: 'dog', name: '狗狗', icon: Dog },
  { id: 'cat', name: '猫咪', icon: Cat },
];

export default function Pets() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { favorites, toggleFavorite, compareList } = useUserStore();
  const { trackSearch } = useAnalyticsStore();
  const { pets: livePets, fetchPets, isLoading } = usePetStore();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

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
    let result = allPets;

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
      result = result.filter(pet => favorites.includes(pet.id as any));
    }

    return result;
  }, [allPets, activeFilter, searchQuery, showFavoritesOnly, favorites]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      trackSearch(value);
    }
  };

  return (
    <div className="min-h-screen bg-warm-gradient">
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
                  onClick={() => setShowCompare(true)}
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

          <div className="flex justify-center gap-2 flex-wrap">
            {CATEGORIES.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all ${activeFilter === filter.id
                    ? 'bg-orange-500 text-white shadow-warm'
                    : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-500'
                    }`}
                >
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

        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            找到 <span className="font-bold text-orange-500">{filteredPets.length}</span> 只宠物
          </p>
          <div className="flex items-center gap-2">
            {(searchQuery || showFavoritesOnly || activeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowFavoritesOnly(false);
                  setActiveFilter('all');
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
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-3xl h-96 animate-pulse border border-gray-100" />
              ))}
            </div>
          ) : filteredPets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPets.map((pet) => (
                <Card
                  key={pet.id}
                  className="group overflow-hidden bg-white border-0 shadow-warm hover:shadow-warm-lg transition-all duration-500 hover:-translate-y-2 cursor-pointer"
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
                          toggleFavorite(pet.id as any);
                        }}
                        className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 hover:scale-110"
                      >
                        <Heart
                          className={`w-5 h-5 transition-colors ${favorites.includes(pet.id as any)
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

                  <CardContent className="p-5">
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

                    <div className="flex flex-wrap gap-2">
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
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">没有找到匹配的宠物</h3>
              <p className="text-gray-500 mb-6">试试其他搜索词或筛选条件</p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setShowFavoritesOnly(false);
                  setActiveFilter('all');
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
              >
                查看全部宠物
              </Button>
            </div>
          )}
        </div>
      </main>

      <PetQuiz isOpen={showQuiz} onClose={() => setShowQuiz(false)} />
      <PetCompare isOpen={showCompare} onClose={() => setShowCompare(false)} />
    </div >
  );
}
