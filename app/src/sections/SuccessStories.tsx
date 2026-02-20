import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Quote, Heart, Calendar, MapPin, ChevronLeft, ChevronRight, Share2, Play, Pause } from 'lucide-react';

interface Story {
  id: number;
  petName: string;
  petType: string;
  adopterName: string;
  location: string;
  date: string;
  image: string;
  avatar: string;
  rating: number;
  title: string;
  content: string;
  fullStory: string;
}

const stories: Story[] = [
  {
    id: 1,
    petName: '旺财',
    petType: '金毛寻回犬',
    adopterName: '李先生一家',
    location: '北京市',
    date: '2024年1月',
    image: '/images/story1.jpg',
    avatar: '/images/dog-golden.jpg',
    rating: 5,
    title: '最温暖的相遇',
    content: '旺财来到我们家已经一年了，它给我们带来了无尽的欢乐。每天早上它都会准时叫我起床，晚上陪我看电视...',
    fullStory: '旺财来到我们家已经一年了，它给我们带来了无尽的欢乐。每天早上它都会准时叫我起床，晚上陪我看电视。记得刚来的时候它还很胆小，总是躲在角落里，但现在它已经完全融入了我们家，成为了不可或缺的一员。\n\n最让我感动的是，有一次我生病了躺在床上，旺财就一直在床边陪着我，用它的头蹭我的手，好像在安慰我。那一刻我真的觉得，领养它是我做过最正确的决定。\n\n感谢宠物领养中心，让我们遇到了这么好的伙伴！',
  },
  {
    id: 2,
    petName: '咪咪',
    petType: '橘猫',
    adopterName: '张女士',
    location: '上海市',
    date: '2024年3月',
    image: '/images/story2.jpg',
    avatar: '/images/cat-orange.jpg',
    rating: 5,
    title: '女儿最好的玩伴',
    content: '咪咪是我送给女儿的生日礼物，现在它和女儿形影不离。咪咪性格特别温顺，女儿怎么抱它都不会生气...',
    fullStory: '咪咪是我送给女儿的生日礼物，现在它和女儿形影不离。咪咪性格特别温顺，女儿怎么抱它都不会生气。\n\n自从有了咪咪，女儿变得更有责任心了，每天放学回家第一件事就是给咪咪喂食、换水、清理猫砂。看着她们一起玩耍的画面，我觉得特别温馨。\n\n咪咪不仅是一只宠物，更是我们家庭的一员，是女儿成长路上最好的伙伴。',
  },
  {
    id: 3,
    petName: '豆豆',
    petType: '柯基犬',
    adopterName: '王大爷',
    location: '广州市',
    date: '2024年2月',
    image: '/images/story3.jpg',
    avatar: '/images/dog-corgi.jpg',
    rating: 5,
    title: '晚年最好的陪伴',
    content: '退休后一个人住，儿女都在外地工作。自从领养了豆豆，我的生活变得充实多了。每天带它散步，和它说话...',
    fullStory: '退休后一个人住，儿女都在外地工作。自从领养了豆豆，我的生活变得充实多了。每天带它散步，和它说话，它虽然不会回答，但总是用那双大眼睛认真地看着我，好像能听懂一样。\n\n豆豆特别聪明，学会了很多指令，坐下、握手、转圈都不在话下。邻居们都很喜欢它，每次出去散步都会引来一群小朋友围观。\n\n感谢宠物领养中心的工作人员，他们不仅帮我找到了豆豆，还经常打电话来询问情况，给了我很多养宠建议。',
  },
];

export default function SuccessStories() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 自动轮播
  useEffect(() => {
    if (isAutoPlay) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % stories.length);
      }, 5000);
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlay]);

  const navigateStory = (direction: 'prev' | 'next') => {
    setIsAutoPlay(false);
    if (direction === 'next') {
      setCurrentIndex((prev) => (prev + 1) % stories.length);
    } else {
      setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
    }
  };

  const handleShare = async (story: Story, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${story.title} - 宠物领养中心`,
          text: `${story.adopterName}分享了他们与${story.petName}的温暖故事`,
          url: window.location.href,
        });
      } catch {
        console.log('分享取消');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('链接已复制到剪贴板');
    }
  };

  const scrollToPets = () => {
    document.getElementById('pets')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="stories" className="py-20 bg-warm-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 mb-4">
            <Star className="w-3 h-3 mr-1" />
            温暖故事
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            他们的
            <span className="text-gradient"> 领养故事</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            每一个领养故事都是一段温暖的旅程，
            听听他们怎么说...
          </p>
          
          {/* Auto Play Control */}
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
          >
            {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isAutoPlay ? '暂停轮播' : '自动轮播'}
          </button>
        </div>

        {/* Featured Story - Large Card */}
        <div className="mb-12">
          <Card className="overflow-hidden bg-white border-0 shadow-warm-lg">
            <div className="grid md:grid-cols-2">
              {/* Image */}
              <div className="relative h-64 md:h-auto overflow-hidden">
                <img
                  src={stories[currentIndex].image}
                  alt={stories[currentIndex].title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:bg-gradient-to-r" />
                
                {/* Navigation Arrows */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={() => navigateStory('prev')}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigateStory('next')}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Pagination Dots */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {stories.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsAutoPlay(false);
                        setCurrentIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentIndex
                          ? 'w-6 bg-white'
                          : 'bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-8 flex flex-col justify-center">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: stories[currentIndex].rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {stories[currentIndex].title}
                </h3>

                <p className="text-gray-600 leading-relaxed mb-6 line-clamp-4">
                  {stories[currentIndex].content}
                </p>

                {/* Pet Info */}
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={stories[currentIndex].avatar}
                    alt={stories[currentIndex].petName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-orange-200"
                  />
                  <div>
                    <div className="font-bold text-gray-800">{stories[currentIndex].petName}</div>
                    <div className="text-sm text-gray-500">{stories[currentIndex].petType}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setSelectedStory(stories[currentIndex])}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                  >
                    阅读完整故事
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => handleShare(stories[currentIndex], e)}
                    className="rounded-full border-orange-200 text-orange-500 hover:bg-orange-50"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* All Stories Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {stories.map((story, index) => (
            <Card
              key={story.id}
              className={`group overflow-hidden bg-white border-0 shadow-warm hover:shadow-warm-lg transition-all duration-500 hover:-translate-y-2 cursor-pointer ${
                index === currentIndex ? 'ring-2 ring-orange-300' : ''
              }`}
              onClick={() => {
                setIsAutoPlay(false);
                setCurrentIndex(index);
                setSelectedStory(story);
              }}
            >
              {/* Image */}
              <div className="relative h-40 overflow-hidden">
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                
                {/* Quote Icon */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                  <Quote className="w-4 h-4 text-orange-500" />
                </div>

                {/* Pet Info */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <img
                    src={story.avatar}
                    alt={story.petName}
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                  <div className="text-white">
                    <div className="font-bold text-sm">{story.petName}</div>
                    <div className="text-xs text-white/80">{story.petType}</div>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                {/* Rating */}
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: story.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Title */}
                <h4 className="font-bold text-gray-800 mb-1 group-hover:text-orange-500 transition-colors">
                  {story.title}
                </h4>

                {/* Content Preview */}
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                  {story.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '1,280+', label: '成功领养' },
            { value: '98%', label: '满意度' },
            { value: '500+', label: '温暖故事' },
            { value: '24h', label: '平均审核时间' },
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 bg-white rounded-2xl shadow-warm">
              <div className="text-3xl font-bold text-orange-500 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            你也想分享你的领养故事吗？
          </p>
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => alert('故事分享功能即将上线，敬请期待！')}
              className="rounded-full px-6 border-orange-200 text-orange-500 hover:bg-orange-50"
            >
              <Heart className="w-4 h-4 mr-2" />
              分享我的故事
            </Button>
            <Button
              onClick={scrollToPets}
              className="rounded-full px-6 bg-orange-500 hover:bg-orange-600 text-white"
            >
              开始领养
            </Button>
          </div>
        </div>
      </div>

      {/* Story Detail Dialog */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedStory && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-800">
                  {selectedStory.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Hero Image */}
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={selectedStory.image}
                    alt={selectedStory.title}
                    className="w-full h-64 object-cover"
                  />
                </div>

                {/* Pet & Adopter Info */}
                <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
                  <img
                    src={selectedStory.avatar}
                    alt={selectedStory.petName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-800">{selectedStory.petName}</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-600">{selectedStory.petType}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {selectedStory.adopterName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {selectedStory.date}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleShare(selectedStory, e)}
                    className="p-2 rounded-full hover:bg-white/50 transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Rating */}
                <div className="flex gap-1">
                  {Array.from({ length: selectedStory.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Full Story */}
                <div className="prose prose-gray max-w-none">
                  {selectedStory.fullStory.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-gray-600 leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                    onClick={() => {
                      setSelectedStory(null);
                      scrollToPets();
                    }}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    我也想要这样的故事
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
