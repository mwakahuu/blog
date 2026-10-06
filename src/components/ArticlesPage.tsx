import React, { useState } from 'react';
import { Post } from '../types';
import { Sidebar } from './Sidebar';
import { BannerAd } from './BannerAds';

interface ArticlesPageProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onSelectCategory?: (category: string) => void;
  onSearch: (query: string) => void;
  onOpenSubscribe?: () => void;
}

export const ArticlesPage: React.FC<ArticlesPageProps> = ({
  posts,
  onSelectPost,
  onSearch,
}) => {
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'readTime'>('newest');
  const [searchFilter, setSearchFilter] = useState('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  let filtered = posts;

  if (searchFilter.trim()) {
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'popular') return b.views - a.views;
    if (sortBy === 'readTime') return parseInt(a.readTime) - parseInt(b.readTime);
    return 0; // default newest
  });

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      {/* Top Page Banner Ad (1 of 3) */}
      <BannerAd type="top" className="mb-6" />

      {/* Page Title Card */}
      <div className="bg-white p-6 sm:p-10 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-condensed">
            Simulizi na ELimu
          </h1>
        </div>

        {/* Search in Articles Input */}
        <div className="w-full md:w-72">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search articles..."
            className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50"
          />
        </div>
      </div>

      {/* Control Bar: Sort & View Layout (No category filters) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-4 border border-slate-200">
        <div className="text-xs text-slate-500 font-semibold">
          Showing {sorted.length} Published Articles
        </div>

        {/* Sort & View Switches */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-slate-300 bg-slate-50 px-2 py-1 text-xs focus:outline-hidden"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Read / Popular</option>
              <option value="readTime">Shortest Read Time</option>
            </select>
          </div>

          <div className="flex items-center border border-slate-300 overflow-hidden">
            <button
              onClick={() => setViewLayout('grid')}
              className={`px-2.5 py-1 ${
                viewLayout === 'grid' ? 'bg-red-600 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
              title="Grid View"
            >
              Grid
            </button>
            <button
              onClick={() => setViewLayout('list')}
              className={`px-2.5 py-1 ${
                viewLayout === 'list' ? 'bg-red-600 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
              title="List View"
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Mid Banner Ad (2 of 3) */}
      <BannerAd type="mid" className="mb-8" />

      {/* Main Grid + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          {sorted.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-500 border border-slate-200">
              No articles found matching "{searchFilter}".
            </div>
          ) : viewLayout === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {sorted.map((post) => (
                <article
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="bg-white border border-slate-200 p-4 shadow-xs flex flex-col group cursor-pointer hover:border-slate-300 transition-colors"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-slate-200 rounded-xs mb-3">
                    <img
                      src={post.image}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2 mb-2 font-condensed">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {post.excerpt}
                  </p>

                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-700">{post.author}</span>
                    <span>{post.date} · {post.readTime}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sorted.map((post) => (
                <article
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="bg-white border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row gap-5 group cursor-pointer hover:border-slate-300 transition-colors"
                >
                  <div className="w-full sm:w-56 aspect-[16/10] sm:aspect-auto shrink-0 overflow-hidden bg-slate-200 rounded-xs">
                    <img
                      src={post.image}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug mb-2 font-condensed">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className="font-semibold text-slate-700">{post.author}</span>
                      <span>{post.date} · ⏱ {post.readTime} · 👁 {post.views.toLocaleString()}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <Sidebar
            posts={posts}
            onSelectPost={onSelectPost}
            onSearch={onSearch}
          />
        </div>
      </div>

      {/* Bottom Banner Ad (3 of 3) */}
      <BannerAd type="bottom" className="mt-12" />
    </div>
  );
};
