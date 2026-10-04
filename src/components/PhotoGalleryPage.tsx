import React, { useEffect, useState } from 'react';
import { GalleryImage } from '../types';
import { BannerAd } from './BannerAds';

interface PhotoGalleryPageProps {
  images: GalleryImage[];
}

export const PhotoGalleryPage: React.FC<PhotoGalleryPageProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    if (!selectedImage) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedImage(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [selectedImage]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 select-none">
      {/* Top Banner Ad */}
      <BannerAd type="top" className="mb-6" />

      {/* Pure Image Gallery: ONLY images, NO frames, NO titles, NO text, NO popups, in different sizes */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[200px] sm:auto-rows-[260px]">
        {images.map((img, index) => {
          // Determine varied sizes for visual rhythm (some tall, some wide, some standard)
          const isSpanWide = index % 5 === 0;
          const isSpanTall = index % 4 === 1;

          return (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedImage(img)}
              className={`overflow-hidden bg-slate-200 transition-transform duration-300 hover:scale-[1.01] text-left ${
                isSpanWide ? 'col-span-2' : ''
              } ${isSpanTall ? 'row-span-2' : ''}`}
              aria-label="Open gallery image in full screen"
            >
              <img
                src={img.url}
                alt=""
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover block"
              />
            </button>
          );
        })}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-8"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl w-full max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-3 right-0 sm:-top-4 sm:right-0 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 text-xl font-bold cursor-pointer"
              aria-label="Close fullscreen image"
            >
              ×
            </button>

            <img
              src={selectedImage.url}
              alt="Full screen gallery view"
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[90vh] object-contain rounded-sm shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Mid Banner Ad */}
      <BannerAd type="mid" className="my-8" />

      {/* Bottom Banner Ad */}
      <BannerAd type="bottom" className="mt-8" />
    </div>
  );
};
