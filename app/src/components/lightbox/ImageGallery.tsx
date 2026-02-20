import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Zoom, Thumbnails } from 'yet-another-react-lightbox/plugins';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

interface ImageGalleryProps {
  images: string[];
  mainImage: string;
  petName: string;
}

export default function ImageGallery({ images, mainImage, petName }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(mainImage);

  const allImages = [mainImage, ...images.filter(img => img !== mainImage)];

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const slides = allImages.map((src) => ({
    src,
    alt: `${petName}的照片`,
  }));

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div 
        className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-zoom-in group"
        onClick={() => openLightbox(allImages.indexOf(selectedImage))}
      >
        <img
          src={selectedImage}
          alt={petName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-sm">
          点击查看大图
        </div>
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image)}
              className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                selectedImage === image
                  ? 'border-orange-500 ring-2 ring-orange-200'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`${petName} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={slides}
        index={currentIndex}
        plugins={[Zoom, Thumbnails]}
        thumbnails={{ position: 'bottom' }}
        animation={{ fade: 300 }}
        render={{
          buttonPrev: allImages.length > 1 ? undefined : () => null,
          buttonNext: allImages.length > 1 ? undefined : () => null,
        }}
      />
    </div>
  );
}
