import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPetById, getRelatedPets, type Pet } from '@/data/pets';
import { useUserStore } from '@/store/userStore';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageGallery from '@/components/lightbox/ImageGallery';
import BookingModal from '@/components/booking/BookingModal';
import { 
  Heart, MapPin, Calendar, Share2, ArrowLeft, 
  CheckCircle2, Stethoscope, 
  Sparkles, Users
} from 'lucide-react';
import { postPetView } from '@/services/api';

export default function PetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { favorites, toggleFavorite, addToCompare, compareList } = useUserStore();
  const { trackPetView } = useAnalyticsStore();
  const [pet, setPet] = useState<Pet | null>(null);
  const [relatedPets, setRelatedPets] = useState<Pet[]>([]);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    if (id) {
      const petId = parseInt(id);
      const foundPet = getPetById(petId);
      if (foundPet) {
        setPet(foundPet);
        setRelatedPets(getRelatedPets(foundPet));
        trackPetView(petId);
      }
    }
  }, [id, trackPetView]);

  useEffect(() => {
    if (id) {
      const petId = parseInt(id);
      postPetView(petId);
    }
  }, [id]);

  if (!pet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">宠物未找到</h1>
          <Button onClick={() => navigate('/')} className="bg-orange-500 hover:bg-orange-600">
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const isFavorite = favorites.includes(pet.id);
  const isInCompare = compareList.includes(pet.id);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `领养${pet.name} - 宠物领养中心`,
          text: `${pet.name}是一只${pet.age}的${pet.breed}，${pet.description}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('分享取消');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  return (
    <div className="min-h-screen bg-warm-gradient">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => toggleFavorite(pet.id)}
                className={`p-2 rounded-full transition-colors ${
                  isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Images */}
          <div>
            <ImageGallery images={pet.images} mainImage={pet.image} petName={pet.name} />
          </div>

          {/* Right: Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={pet.type === 'dog' ? 'bg-blue-500' : 'bg-pink-500'}>
                  {pet.type === 'dog' ? '狗狗' : '猫咪'}
                </Badge>
                <Badge variant="outline" className="text-orange-500 border-orange-200">
                  {pet.breed}
                </Badge>
                {pet.isFeatured && (
                  <Badge className="bg-amber-500">
                    <Sparkles className="w-3 h-3 mr-1" />
                    推荐
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{pet.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  {pet.age}
                </span>
                <span className="flex items-center gap-1">
                  {pet.gender === 'male' ? '♂' : '♀'}
                  {pet.gender === 'male' ? '公' : '母'}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-orange-500" />
                  {pet.location}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-orange-500" />
                  {pet.views} 次浏览
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {pet.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">
              {pet.fullDescription}
            </p>

            {/* Health Status */}
            <div className="flex gap-4">
              <div className={`flex items-center gap-2 ${pet.vaccinated ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle2 className="w-5 h-5" />
                <span>{pet.vaccinated ? '已疫苗' : '未疫苗'}</span>
              </div>
              <div className={`flex items-center gap-2 ${pet.neutered ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle2 className="w-5 h-5" />
                <span>{pet.neutered ? '已绝育' : '未绝育'}</span>
              </div>
            </div>

            {/* Personality & Suitable For */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">性格特点</h4>
                <div className="flex flex-wrap gap-1">
                  {pet.personality.map((p, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">适合人群</h4>
                <div className="flex flex-wrap gap-1">
                  {pet.suitableFor.map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-md">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => navigate(`/?pet=${pet.id}#contact`)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full"
              >
                <Heart className="w-4 h-4 mr-2" />
                申请领养
              </Button>
              <Button
                onClick={() => setIsBookingOpen(true)}
                variant="outline"
                className="flex-1 rounded-full border-orange-200 text-orange-500 hover:bg-orange-50"
              >
                <Calendar className="w-4 h-4 mr-2" />
                预约看宠
              </Button>
              <Button
                onClick={() => addToCompare(pet.id)}
                variant="outline"
                disabled={isInCompare}
                className="rounded-full border-gray-200"
              >
                {isInCompare ? '已对比' : '对比'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="health" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="health">健康档案</TabsTrigger>
              <TabsTrigger value="related">相关推荐</TabsTrigger>
            </TabsList>

            <TabsContent value="health" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-orange-500" />
                    健康记录
                  </h3>
                  <div className="space-y-4">
                    {pet.healthRecords.map((record, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-800">{record.name}</h4>
                            <span className="text-sm text-gray-500">{record.date}</span>
                          </div>
                          <p className="text-sm text-gray-600">{record.description}</p>
                          {record.vet && (
                            <p className="text-xs text-gray-400 mt-1">
                              医生: {record.vet}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="related" className="mt-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPets.map((relatedPet) => (
                  <Card
                    key={relatedPet.id}
                    className="overflow-hidden cursor-pointer hover:shadow-warm-lg transition-all"
                    onClick={() => navigate(`/pet/${relatedPet.id}`)}
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={relatedPet.image}
                        alt={relatedPet.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-bold text-gray-800">{relatedPet.name}</h4>
                      <p className="text-sm text-gray-500">{relatedPet.breed}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        petId={pet.id}
        petName={pet.name}
      />
    </div>
  );
}
