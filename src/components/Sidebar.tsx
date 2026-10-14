import React, { useState } from 'react';
import { Post } from '../types';
import { BannerAd } from './BannerAds';

interface SidebarProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onSelectCategory?: (category: string) => void;
  onSearch: (query: string) => void;
  onOpenSubscribe?: () => void;
  compact?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  posts,
  onSelectPost,
  onSearch,
  compact = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const recentPosts = posts.slice(0, 5);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <aside className={`w-full flex flex-col gap-5 select-none ${compact ? 'catalog-sidebar' : ''}`}>
      {/* Widget 1: Search */}
      <div className="bg-white p-5 border border-slate-200 shadow-xs">
        {!compact && (
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 mb-4 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-12 after:h-[2px] after:bg-red-600 font-condensed">
            Search Articles
          </h3>
        )}
        <form onSubmit={handleSearchSubmit} className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type here to search..."
            aria-label="Search articles"
            className="flex-1 min-w-0 px-3 py-2.5 text-sm border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50"
          />
          <button
            type="submit"
            aria-label="Search"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold transition-colors cursor-pointer"
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
            </svg>
          </button>
        </form>
      </div>

      {/* Widget 2: Static Banner Ad */}
      {!compact && <BannerAd type="mid" />}

      {/* Widget 3: Recent Posts */}
      <div className="bg-white border border-slate-200 shadow-xs">
        <h3 className={compact
          ? 'catalog-panel-heading'
          : 'text-sm font-bold uppercase tracking-wider text-slate-900 p-5 pb-2 mb-4 border-b-2 border-slate-200 font-condensed'}
        >
          {compact ? 'Featured Posts' : 'Recent Stories'}
        </h3>
        <div className={`flex flex-col gap-3 ${compact ? 'p-4' : 'px-5 pb-5'}`}>
          {recentPosts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => onSelectPost(post)}
              className="flex items-center gap-3 group cursor-pointer text-left"
              aria-label={`Read article: ${post.title}`}
            >
              <div className="w-24 h-16 shrink-0 overflow-hidden bg-slate-200">
                <img
                  src={post.image}
                  alt={post.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-800 group-hover:text-red-600 transition-colors line-clamp-3 leading-snug">
                  {post.title}
                </h4>
                <div className="text-[11px] text-slate-500 mt-1">
                  {post.date}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Widget 4: Static Banner Ad Bottom */}
      {!compact && <BannerAd type="bottom" />}

      {/* Widget 5: About Chombezo */}
      {!compact && <div className="bg-white p-5 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 mb-4 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-12 after:h-[2px] after:bg-red-600 font-condensed">
          Kuhusu CHOMBEZO
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          CHOMBEZO ni jukwaa la habari, burudani na maudhui mbalimbali kwa wasomaji wetu.
        </p>
        <div className="flex items-center gap-2 text-xs font-bold text-red-600">
          <span>By admin</span>
          <span>·</span>
          <span>Version 2.0.1</span>
        </div>
      </div>}
    </aside>
  );
};
