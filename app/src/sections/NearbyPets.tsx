import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNearbyPets } from '@/services/api';
import { mapBackendPetToFrontend } from '@/utils/petMapper';
import type { Pet } from '@/data/pets';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Loader2, ChevronRight } from 'lucide-react';

export default function NearbyPets() {
    const navigate = useNavigate();
    const [pets, setPets] = useState<(Pet & { distance?: number })[]>([]);
    const [loading, setLoading] = useState(false);
    const [located, setLocated] = useState(false);
    const [error, setError] = useState('');

    const handleLocate = () => {
        if (!navigator.geolocation) {
            setError('您的浏览器不支持定位功能');
            return;
        }
        setLoading(true);
        setError('');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                try {
                    const result = await fetchNearbyPets({ lat: loc.lat, lng: loc.lng, radius: 100, limit: 8 });
                    const mapped = (result.data || []).map((p: any) => ({
                        ...mapBackendPetToFrontend(p),
                        distance: p.distance,
                    }));
                    setPets(mapped);
                    setLocated(true);
                } catch {
                    setError('获取附近宠物失败');
                }
                setLoading(false);
            },
            () => {
                setError('定位失败，请允许浏览器访问您的位置');
                setLoading(false);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    // Auto-trigger on mount
    useEffect(() => {
        handleLocate();
    }, []);

    const formatDistance = (km: number) => {
        if (km < 1) return `${Math.round(km * 1000)}m`;
        return `${km.toFixed(1)}km`;
    };

    return (
        <section className="py-16 bg-gradient-to-b from-orange-50/50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <Navigation className="w-7 h-7 text-orange-500" />
                            附近的宠物
                        </h2>
                        <p className="text-gray-500 mt-1">发现你身边等待领养的毛孩子</p>
                    </div>
                    {!located && !loading && (
                        <Button
                            onClick={handleLocate}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                        >
                            <MapPin className="w-4 h-4 mr-2" />
                            开启定位
                        </Button>
                    )}
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500 mr-2" />
                        <span className="text-gray-500">正在定位...</span>
                    </div>
                )}

                {error && !loading && (
                    <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">{error}</p>
                        <Button
                            onClick={handleLocate}
                            variant="outline"
                            className="rounded-full border-orange-200 text-orange-500 hover:bg-orange-50"
                        >
                            重新定位
                        </Button>
                    </div>
                )}

                {located && pets.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-orange-300" />
                        </div>
                        <p className="text-gray-500">附近暂无宠物信息</p>
                        <p className="text-gray-400 text-sm mt-1">新发布的宠物设置地图定位后会显示在这里</p>
                    </div>
                )}

                {pets.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {pets.map((pet) => (
                                <Card
                                    key={pet.id}
                                    className="group overflow-hidden bg-white border-0 shadow-warm hover:shadow-warm-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                    onClick={() => navigate(`/pet/${pet.id}`)}
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <img
                                            src={pet.image}
                                            alt={pet.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/cat-orange.jpg' }}
                                        />
                                        <div className="absolute top-3 left-3">
                                            <Badge className="bg-orange-500/90 text-white">
                                                {pet.type === 'dog' ? '狗狗' : '猫咪'}
                                            </Badge>
                                        </div>
                                        {pet.distance !== undefined && pet.distance !== null && (
                                            <div className="absolute top-3 right-3">
                                                <Badge className="bg-white/95 text-orange-600 shadow-sm">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {formatDistance(pet.distance)}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-4">
                                        <h3 className="font-bold text-gray-800 mb-1">{pet.name}</h3>
                                        <p className="text-sm text-gray-500">{pet.breed}</p>
                                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                            <MapPin className="w-3 h-3" />
                                            {pet.location}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <div className="flex justify-center mt-8">
                            <Button
                                onClick={() => navigate('/pets')}
                                variant="outline"
                                className="rounded-full border-orange-200 text-orange-500 hover:bg-orange-50"
                            >
                                查看全部宠物
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
