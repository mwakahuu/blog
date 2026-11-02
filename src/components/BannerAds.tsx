import React from 'react';
import { getWhatsAppUrl } from '../whatsapp';

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
    <div className={`my-4 w-full overflow-hidden border border-slate-200 bg-white shadow-xs ${className}`}>
      <a
        href={getWhatsAppUrl('Habari, nahitaji maelezo kuhusu tangazo lako')}
        target="_blank"
        rel="noreferrer"
        className="block w-full transition-opacity hover:opacity-95"
        title="Bofya kuwasiliana kupitia WhatsApp"
      >
        <img
          src={imageUrl}
          alt="Advertisement Banner"
          referrerPolicy="no-referrer"
          className="block h-auto w-full object-contain"
        />
      </a>
    </div>
  );
};
