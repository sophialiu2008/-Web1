import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share2, PawPrint, Heart, Award } from 'lucide-react';

interface AdoptionCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  adopterName: string;
  date: string;
  certificateId: string;
}

export default function AdoptionCertificate({
  isOpen,
  onClose,
  petName,
  adopterName,
  date,
  certificateId,
}: AdoptionCertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    // In a real app, this would generate and download a PDF
    alert('证书下载功能即将上线！');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '我的领养证书',
          text: `我领养了${petName}，这是我人生中最美好的决定之一！`,
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-warm-lg">
        {/* Certificate */}
        <div
          ref={certificateRef}
          className="relative p-8 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100"
        >
          {/* Decorative Border */}
          <div className="absolute inset-4 border-4 border-double border-orange-300 rounded-2xl" />
          
          {/* Corner Decorations */}
          <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-orange-400" />
          <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-orange-400" />
          <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-orange-400" />
          <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-orange-400" />

          {/* Content */}
          <div className="relative text-center py-8">
            {/* Header */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-orange-600 mb-2">
              领养证书
            </h2>
            <p className="text-orange-400 text-sm mb-6">
              Certificate of Adoption
            </p>

            {/* Main Text */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              兹证明
            </p>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              {adopterName}
            </h3>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              于 {date} 正式领养
            </p>
            
            <h3 className="text-3xl font-bold text-orange-500 mb-6">
              {petName}
            </h3>

            <div className="flex justify-center mb-6">
              <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            </div>

            <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto mb-6">
              感谢你选择领养，给流浪动物一个温暖的家。
              愿你们相伴一生，共享美好时光。
            </p>

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 text-orange-500 mb-4">
              <PawPrint className="w-5 h-5" />
              <span className="font-medium">宠物领养中心</span>
              <PawPrint className="w-5 h-5" />
            </div>

            <p className="text-xs text-gray-400">
              证书编号: {certificateId}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-white border-t border-gray-100 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={handleDownload}
            className="rounded-full"
          >
            <Download className="w-4 h-4 mr-2" />
            下载证书
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
            className="rounded-full"
          >
            <Share2 className="w-4 h-4 mr-2" />
            分享
          </Button>
          <Button
            onClick={onClose}
            className="rounded-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            完成
          </Button>
        </div>
      </div>
    </div>
  );
}
