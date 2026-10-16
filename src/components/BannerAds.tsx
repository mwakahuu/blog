import React from 'react';

export const BANNER_ADS = {
  top: 'https://i.ibb.co/fVNYGQf8/miliki-website-yako-ya-xxx-leo-2.png',
  mid: 'https://i.ibb.co/4ZSqy6sp/miliki-website-yako-ya-xxx-leo-3.png',
  bottom: 'https://i.ibb.co/FkBJQBvg/miliki-website-yako-ya-xxx-leo-4.png',
};

interface BannerAdProps {
  type: 'top' | 'mid' | 'bottom';
  className?: string;
}

export const BannerAd: React.FC<BannerAdProps> = ({ type, className = '' }) => {
  const imageUrl = BANNER_ADS[type];

  return (
    <div className={`w-full flex items-center justify-center my-4 overflow-hidden shadow-xs border border-slate-200 bg-white ${className}`}>
      <a
        href="https://wa.me/255794406730?text=Habari,%20nahitaji%20maelezo%20kuhusu%20tangazo%20lako"
        target="_blank"
        rel="noreferrer"
        className="w-full flex items-center justify-center block hover:opacity-95 transition-opacity"
        title="Bofya kuwasiliana kupitia WhatsApp"
      >
        <img
          src={imageUrl}
          alt="Advertisement Banner"
          referrerPolicy="no-referrer"
          className="w-full max-h-[140px] sm:max-h-[160px] md:max-h-[180px] object-cover sm:object-contain bg-slate-900"
        />
      </a>
    </div>
  );
};
