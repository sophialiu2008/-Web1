import { Button } from '@/components/ui/button';
import { Heart, PawPrint, ChevronDown } from 'lucide-react';
import { useStatsStore } from '@/store/statsStore';
import { useEffect } from 'react';

export default function Hero() {
  const { successfulAdoptions, totalPets, satisfactionRate, fetchStats } = useStatsStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const scrollToPets = () => {
    document.getElementById('pets')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-pets.jpg"
          alt="可爱的宠物们"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
          <PawPrint className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-700">给流浪动物一个温暖的家</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight mt-12 sm:mt-0">
          用爱点亮
          <span className="block text-orange-300">每一个生命</span>
        </h1>

        {/* Description */}
        <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
          在这里，每一只宠物都在等待一个温暖的家。
          <br className="hidden sm:block" />
          选择领养，选择用爱改变生命。
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-6 sm:gap-10 mb-10">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
              {successfulAdoptions > 0 ? `${successfulAdoptions.toLocaleString()}+` : '0'}
            </div>
            <div className="text-sm text-white/70">成功领养</div>
          </div>
          <div className="w-px h-12 bg-white/30 hidden sm:block" />
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
              {totalPets > 0 ? totalPets : '0'}
            </div>
            <div className="text-sm text-white/70">待领养宠物</div>
          </div>
          <div className="w-px h-12 bg-white/30 hidden sm:block" />
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{satisfactionRate}%</div>
            <div className="text-sm text-white/70">满意度</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={scrollToPets}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-full shadow-warm-lg transition-all duration-300 hover:scale-105"
          >
            <Heart className="w-5 h-5 mr-2" />
            寻找我的伙伴
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-8 py-6 text-lg rounded-full transition-all duration-300"
          >
            了解领养流程
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <ChevronDown className="w-8 h-8 text-white/70" />
      </div>
    </section>
  );
}
