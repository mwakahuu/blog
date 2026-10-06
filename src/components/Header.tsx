import React from 'react';

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
            Habari · Burudani · Video · Picha
          </p>
        </div>

        {/* Top Static Banner Advertisement */}
        <div className="w-full lg:max-w-[728px] xl:max-w-[840px] h-[90px] sm:h-[105px] relative rounded-xs overflow-hidden shadow-lg border border-slate-700/60 bg-black">
          <a
            href="https://wa.me/255623709042?text=Habari,%20nahitaji%20maelezo%20kuhusu%20tangazo%20lako"
            target="_blank"
            rel="noreferrer"
            className="w-full h-full block group"
            title="Bofya kuwasiliana kupitia WhatsApp 0623709042"
          >
            <img
              src="https://i.ibb.co/fVNYGQf8/miliki-website-yako-ya-xxx-leo-2.png"
              alt="Banner Advertisement"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
            />
          </a>
        </div>
      </div>
    </header>
  );
};
