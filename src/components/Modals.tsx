import React, { useState } from 'react';
import { Post } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  onSelectPost: (post: Post) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  posts,
  onSelectPost,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = query.trim()
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.excerpt.toLowerCase().includes(query.toLowerCase()) ||
          p.categories.some((c) => c.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 bg-slate-50">
          <svg className="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all stories, categories, or keywords..."
            className="flex-1 text-sm bg-transparent focus:outline-hidden text-slate-900"
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg px-2 font-mono"
            aria-label="Close search"
          >
            ✕
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 divide-y divide-slate-100">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Type keywords above to search MagazineSpare archive.
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching stories found for "{query}".
            </div>
          ) : (
            results.map((post) => (
              <div
                key={post.id}
                onClick={() => {
                  onSelectPost(post);
                  onClose();
                }}
                className="py-3 first:pt-0 flex items-center gap-4 group cursor-pointer hover:bg-slate-50 px-2 transition-colors"
              >
                <div className="w-14 h-14 shrink-0 overflow-hidden bg-slate-200 rounded-xs">
                  <img
                    src={post.image}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-red-600 uppercase">
                    {post.categories.join(' · ')}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">
                    {post.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {post.excerpt}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 text-lg font-mono"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="inline-block bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs mb-2">
            MagazineSpare Daily
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 font-condensed">
            Subscribe to Newsletter
          </h3>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Get the latest breaking analysis, global tech insights, and architectural spotlights delivered straight to your inbox every morning.
          </p>
        </div>

        {subscribed ? (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs text-center rounded">
            ✓ Check your inbox! A confirmation link has been sent to <strong>{email}</strong>.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50"
              />
            </div>

            <div className="text-[11px] text-slate-500">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="text-red-600" />
                <span>Weekly Editor's Picks & Breaking Alerts</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 transition-colors cursor-pointer"
            >
              Confirm Subscription
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

interface WatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  onSelectPost: (post: Post) => void;
}

export const WatchModal: React.FC<WatchModalProps> = ({
  isOpen,
  onClose,
  posts,
  onSelectPost,
}) => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  if (!isOpen || !posts.length) return null;

  const videoItems = [
    {
      post: posts.find((p) => p.id === 'inside-the-rise-of-electric-vehicles') || posts[0],
      duration: '04:15',
      badge: 'Special Report'
    },
    {
      post: posts.find((p) => p.id === 'how-ai-is-transforming-small-businesses') || posts[1],
      duration: '03:40',
      badge: 'Tech Dispatch'
    },
    {
      post: posts.find((p) => p.id === 'exploring-historic-cities') || posts[2],
      duration: '06:10',
      badge: 'Culture Documentary'
    },
  ];

  const currentVideo = videoItems[activeVideoIndex];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-slate-900 text-white border border-slate-700 shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-black border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-white font-condensed">
              MagazineSpare Live Video Player
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-mono"
          >
            ✕
          </button>
        </div>

        {/* Video Player Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 relative aspect-video bg-black flex items-center justify-center overflow-hidden">
            <img
              src={currentVideo.post.image}
              alt={currentVideo.post.title}
              className="w-full h-full object-cover opacity-80"
            />
            {/* Play overlay button */}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white cursor-pointer shadow-lg transition-transform hover:scale-110 mb-3">
                <svg className="w-8 h-8 fill-current ml-1" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="text-[11px] font-bold text-red-400 uppercase tracking-widest">
                {currentVideo.badge} · {currentVideo.duration}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white max-w-md line-clamp-2 mt-1">
                {currentVideo.post.title}
              </h3>
            </div>
          </div>

          {/* Playlist Sidebar */}
          <div className="bg-slate-950 p-4 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col divide-y divide-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-condensed">
              Featured Video Playlist
            </div>
            {videoItems.map((item, idx) => (
              <div
                key={item.post.id}
                onClick={() => setActiveVideoIndex(idx)}
                className={`py-2.5 first:pt-0 flex items-center gap-3 cursor-pointer transition-colors ${
                  activeVideoIndex === idx ? 'text-red-500 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <div className="w-12 h-10 shrink-0 overflow-hidden bg-slate-800 relative">
                  <img
                    src={item.post.image}
                    alt={item.post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 bg-black/80 text-[9px] px-1 text-white">
                    {item.duration}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400">{item.badge}</div>
                  <div className="text-xs line-clamp-2 leading-tight">
                    {item.post.title}
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-4 mt-auto">
              <button
                onClick={() => {
                  onSelectPost(currentVideo.post);
                  onClose();
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider py-2 text-center"
              >
                Read Full Story
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AdInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdInfoModal: React.FC<AdInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white border border-slate-200 shadow-2xl p-6 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 text-lg font-mono"
        >
          ✕
        </button>

        <div className="text-xs font-bold text-red-600 uppercase tracking-widest font-condensed">
          Advertising Opportunities
        </div>
        <h3 className="text-2xl font-extrabold text-slate-900 font-condensed mt-1">
          Leaderboard Sponsor Placement · 930x110
        </h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          MagazineSpare provides premium, high-visibility header banner ad inventory positioned directly beneath the top navigation for maximum reader engagement.
        </p>

        <div className="grid grid-cols-2 gap-3 my-4 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-500 uppercase text-[10px]">Slot Dimensions</div>
            <div className="font-mono text-slate-900 font-bold">930 × 110 px</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-500 uppercase text-[10px]">Monthly Impressions</div>
            <div className="font-mono text-slate-900 font-bold">250,000+ Verified</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-500 uppercase text-[10px]">Responsive Scaling</div>
            <div className="font-mono text-slate-900 font-bold">Auto fluid resize</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200">
            <div className="font-bold text-slate-500 uppercase text-[10px]">Ad Formats</div>
            <div className="font-mono text-slate-900 font-bold">HTML5, PNG, WebP</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-2.5 transition-colors cursor-pointer"
        >
          Close Ad Info
        </button>
      </div>
    </div>
  );
};
