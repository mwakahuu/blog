import React, { useState } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-[#dc2626] text-white shadow-md relative z-40 select-none">
      <div className="max-w-[1400px] mx-auto flex items-stretch justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Navigation Links */}
        <div className="flex items-center">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:bg-red-700 rounded mr-2 cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

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
              <span>Videos</span>
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
        <div className="flex items-stretch">
          {/* Watch Button -> Navigates directly to videos page */}
          <button
            onClick={() => onNavigate('videos')}
            className={`px-5 py-3.5 flex items-center gap-2 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${
              currentView === 'videos' ? 'bg-black text-red-400' : 'bg-[#1e293b] hover:bg-[#0f172a] text-white'
            }`}
            title="Watch Web Videos"
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

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#b91c1c] border-t border-red-800 px-4 py-3 space-y-1">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold rounded hover:bg-red-700 text-white cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('articles');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold rounded hover:bg-red-700 text-white cursor-pointer"
          >
            Articles
          </button>
          <button
            onClick={() => {
              onNavigate('shop');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold rounded hover:bg-red-700 text-white cursor-pointer"
          >
            Shop
          </button>
          <button
            onClick={() => {
              onNavigate('videos');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold rounded hover:bg-red-700 text-white cursor-pointer"
          >
            Videos
          </button>
          <button
            onClick={() => {
              onNavigate('gallery');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold rounded hover:bg-red-700 text-white cursor-pointer"
          >
            Photo Gallery
          </button>
          <button
            onClick={() => {
              onNavigate('contact');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-semibold rounded hover:bg-red-700 text-white cursor-pointer"
          >
            Contact
          </button>
        </div>
      )}
    </nav>
  );
};
