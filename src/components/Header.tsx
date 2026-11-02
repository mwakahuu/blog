import React from 'react';
import { getWhatsAppUrl, WHATSAPP_PHONE_DISPLAY } from '../whatsapp';

interface HeaderProps {
  onNavigateHome: () => void;
  onAdClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateHome, onAdClick }) => {
  return (
    <header className="bg-[#0b0f19] text-white py-6 px-4 sm:px-6 lg:px-8 border-b border-slate-900">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Brand Logo & Tagline */}
        <div 
          onClick={onNavigateHome}
          className="cursor-pointer group select-none text-center lg:text-left shrink-0"
        >
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white group-hover:text-red-500 transition-colors font-condensed">
            CHOMBEZO
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide mt-0.5">
            VIDEO ZA KUTOMBANA
          </p>
        </div>

        {/* Top Static Banner Advertisement */}
        <div className="relative w-full overflow-hidden rounded-xs border border-slate-700/60 bg-black shadow-lg lg:h-[90px] lg:max-w-[728px] xl:max-w-[840px]">
          <a
            href={getWhatsAppUrl('Habari, nahitaji maelezo kuhusu tangazo lako')}
            target="_blank"
            rel="noreferrer"
            className="group block w-full"
            title={`Bofya kuwasiliana kupitia WhatsApp ${WHATSAPP_PHONE_DISPLAY}`}
          >
            <img
              src="https://i.ibb.co/fVNYGQf8/miliki-website-yako-ya-xxx-leo-2.png"
              alt="Banner Advertisement"
              referrerPolicy="no-referrer"
              className="block h-auto w-full object-contain transition-opacity group-hover:opacity-90 lg:h-full"
            />
          </a>
        </div>
      </div>
    </header>
  );
};
