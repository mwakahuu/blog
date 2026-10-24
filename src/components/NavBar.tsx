import React from 'react';
import { ViewMode } from '../types';

interface NavBarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  onOpenSearch: () => void;
  onOpenWatch?: () => void;
}

export const NavBar: React.FC<NavBarProps> = ({
  currentView,
  onNavigate,
  onOpenSearch,
  onOpenWatch,
}) => {
  return (
    <nav aria-label="Main navigation" className="bg-[#dc2626] text-white shadow-md relative z-40 select-none">
      <div className="max-w-[1400px] mx-auto flex items-stretch justify-between px-3 sm:px-6 lg:px-8">
        {/* Left Navigation Links */}
        <div className="flex items-center">
          <div className="grid grid-cols-2 gap-2 w-full py-2 lg:hidden">
            <button
              type="button"
              onClick={() => onNavigate('videos')}
              aria-current={currentView === 'videos' ? 'page' : undefined}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-extrabold uppercase tracking-wide shadow-sm transition-colors cursor-pointer ${
                currentView === 'videos'
                  ? 'bg-white text-red-700 ring-2 ring-white/50'
                  : 'bg-[#1e293b] text-white hover:bg-[#0f172a]'
              }`}
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              Chombezo Videos
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-black tracking-widest ${
                currentView === 'videos' ? 'bg-red-100 text-red-700' : 'bg-white/15 text-red-200'
              }`}>
                WATCH
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              aria-current={currentView === 'shop' ? 'page' : undefined}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-extrabold uppercase tracking-wide shadow-sm transition-colors cursor-pointer ${
                currentView === 'shop'
                  ? 'bg-white text-red-700 ring-2 ring-white/50'
                  : 'bg-[#1e293b] text-white hover:bg-[#0f172a]'
              }`}
            >
              <svg className="h-5 w-5 fill-none stroke-current" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L22 7H6M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
              </svg>
              Shop
            </button>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-stretch text-sm font-semibold">
            {/* Home */}
            <button
              onClick={() => onNavigate('home')}
              className={`px-4 py-3.5 flex items-center transition-colors cursor-pointer ${
                currentView === 'home' ? 'bg-[#b91c1c] text-white' : 'hover:bg-red-700 text-white'
              }`}
            >
              Home
            </button>

            {/* Articles */}
            <button
              onClick={() => onNavigate('articles')}
              className={`px-4 py-3.5 flex items-center transition-colors cursor-pointer ${
                currentView === 'articles' ? 'bg-[#b91c1c] text-white' : 'hover:bg-red-700 text-white'
              }`}
            >
              Articles
            </button>

            {/* Shop */}
            <button
              onClick={() => onNavigate('shop')}
              className={`px-4 py-3.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'shop' ? 'bg-[#b91c1c] text-white' : 'hover:bg-red-700 text-white'
              }`}
            >
              <span>Shop</span>
            </button>

            {/* Videos */}
            <button
              onClick={() => onNavigate('videos')}
              className={`px-4 py-3.5 flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'videos' ? 'bg-[#b91c1c] text-white' : 'hover:bg-red-700 text-white'
              }`}
            >
              <span>Chombezo Videos</span>
              <span className="bg-black/30 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">
                HD
              </span>
            </button>

            {/* Gallery (Photo Gallery Page) */}
            <button
              onClick={() => onNavigate('gallery')}
              className={`px-4 py-3.5 flex items-center transition-colors cursor-pointer ${
                currentView === 'gallery' ? 'bg-[#b91c1c] text-white' : 'hover:bg-red-700 text-white'
              }`}
            >
              Gallery
            </button>

            {/* Contact */}
            <button
              onClick={() => onNavigate('contact')}
              className={`px-4 py-3.5 flex items-center transition-colors cursor-pointer ${
                currentView === 'contact' ? 'bg-[#b91c1c] text-white' : 'hover:bg-red-700 text-white'
              }`}
            >
              Contact
            </button>
          </div>
        </div>

        {/* Right Nav Utilities: Watch & Search */}
        <div className="hidden lg:flex items-stretch">
          {/* Watch Button -> Navigates directly to videos page */}
          <button
            onClick={() => onNavigate('videos')}
            className={`px-5 py-3.5 flex items-center gap-2 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
              currentView === 'videos' ? 'bg-black text-red-400' : 'bg-[#1e293b] hover:bg-[#0f172a] text-white'
            }`}
            title="Watch Chombezo Videos"
          >
            <svg className="w-4 h-4 fill-red-500" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Watch</span>
          </button>

          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="px-4 hover:bg-red-700 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Search articles"
            aria-label="Search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

    </nav>
  );
};
