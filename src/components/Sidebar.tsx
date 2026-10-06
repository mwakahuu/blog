import React, { useState } from 'react';
import { Post } from '../types';
import { BannerAd } from './BannerAds';

interface SidebarProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onSelectCategory?: (category: string) => void;
  onSearch: (query: string) => void;
  onOpenSubscribe?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  posts,
  onSelectPost,
  onSearch,
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
    <aside className="w-full flex flex-col gap-6 select-none">
      {/* Widget 1: Search */}
      <div className="bg-white p-5 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 mb-4 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-12 after:h-[2px] after:bg-red-600 font-condensed">
          Search Articles
        </h3>
        <form onSubmit={handleSearchSubmit} className="flex">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type and press enter..."
            className="flex-1 px-3 py-2 text-xs border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50"
          />
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* Widget 2: Static Banner Ad */}
      <BannerAd type="mid" />

      {/* Widget 3: Recent Posts */}
      <div className="bg-white p-5 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 mb-4 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-12 after:h-[2px] after:bg-red-600 font-condensed">
          Recent Stories
        </h3>
        <div className="flex flex-col divide-y divide-slate-100">
          {recentPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => onSelectPost(post)}
              className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3 group cursor-pointer"
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
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-tight">
                  {post.title}
                </h4>
                <div className="text-[10px] text-slate-400 mt-1">
                  {post.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Widget 4: Static Banner Ad Bottom */}
      <BannerAd type="bottom" />

      {/* Widget 5: About Chombezo */}
      <div className="bg-white p-5 border border-slate-200 shadow-xs">
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
      </div>
    </aside>
  );
};
