import React from 'react';
import { Post } from '../types';

interface MainGridProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onSelectCategory?: (category: string) => void;
}

export const MainGrid: React.FC<MainGridProps> = ({
  posts,
  onSelectPost,
}) => {
  if (!posts.length) {
    return (
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 select-none">
        <div className="rounded-sm border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-xl font-bold uppercase tracking-wide text-slate-700 font-condensed">No published stories yet</h2>
          <p className="mt-2 text-sm text-slate-500">Add a post from the admin panel and it will appear here automatically.</p>
        </div>
      </section>
    );
  }

  // Use posts array dynamically so newest story episodes appear on front page
  const mainStory = posts[0];
  const sportsPost = posts[1] || posts[0];
  const streamingPost = posts[2] || posts[0];
  const aiPost = posts[3] || posts[0];
  const evPost = posts[4] || posts[0];

  // 5 Trending items
  const trendingList = [
    { post: posts[4] || posts[0] },
    { post: posts[3] || posts[0] },
    { post: posts[2] || posts[0] },
    { post: posts[1] || posts[0] },
    { post: posts[0] },
  ];

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
        {/* ============================================================== */}
        {/* COLUMN 1: MAIN STORY (lg:col-span-4) */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 flex flex-col">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-2 mb-4 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase font-condensed">
              Main Story
            </h2>
          </div>

          {/* Main Story Content */}
          <article className="flex flex-col flex-1 group">
            {/* Featured Image */}
            <div 
              onClick={() => onSelectPost(mainStory)}
              className="relative aspect-[16/10] overflow-hidden bg-slate-200 cursor-pointer shadow-sm rounded-xs mb-3"
            >
              <img
                src={mainStory.image}
                alt={mainStory.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Headline */}
            <h3 
              onClick={() => onSelectPost(mainStory)}
              className="text-xl sm:text-2xl font-extrabold text-slate-950 group-hover:text-red-600 transition-colors cursor-pointer leading-tight mb-2 font-condensed"
            >
              {mainStory.title}
            </h3>

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mb-3">
              <span className="font-semibold text-slate-700">{mainStory.author}</span>
              <span>·</span>
              <span>{mainStory.date}</span>
            </div>

            {/* Excerpt */}
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {mainStory.excerpt}
            </p>

            {/* Continue Reading Button */}
            <div className="mt-auto pt-2">
              <button
                onClick={() => onSelectPost(mainStory)}
                className="inline-block border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors px-4 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Soma Zaidi
              </button>
            </div>
          </article>
        </div>

        {/* ============================================================== */}
        {/* COLUMN 2: MOST SHARED (lg:col-span-3 xl:col-span-2) */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 xl:col-span-2 flex flex-col">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-2 mb-4 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase font-condensed">
              Most Shared
            </h2>
          </div>

          {/* 2 Vertical Cards */}
          <div className="flex flex-col gap-6 flex-1">
            <article className="group flex flex-col">
              <div 
                onClick={() => onSelectPost(sportsPost)}
                className="aspect-[4/3] overflow-hidden bg-slate-200 cursor-pointer shadow-xs rounded-xs mb-2.5"
              >
                <img
                  src={sportsPost.image}
                  alt={sportsPost.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Title */}
              <h4 
                onClick={() => onSelectPost(sportsPost)}
                className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors cursor-pointer leading-snug line-clamp-3 mb-1 font-condensed"
              >
                {sportsPost.title}
              </h4>

              <div className="text-[11px] text-slate-500 font-medium">
                {sportsPost.author} · {sportsPost.date}
              </div>
            </article>

            <article className="group flex flex-col pt-3 border-t border-slate-100">
              <div 
                onClick={() => onSelectPost(streamingPost)}
                className="aspect-[4/3] overflow-hidden bg-slate-200 cursor-pointer shadow-xs rounded-xs mb-2.5"
              >
                <img
                  src={streamingPost.image}
                  alt={streamingPost.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Title */}
              <h4 
                onClick={() => onSelectPost(streamingPost)}
                className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors cursor-pointer leading-snug line-clamp-3 mb-1 font-condensed"
              >
                {streamingPost.title}
              </h4>

              <div className="text-[11px] text-slate-500 font-medium">
                {streamingPost.author} · {streamingPost.date}
              </div>
            </article>
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMN 3: EDITOR'S PICKS (lg:col-span-3 xl:col-span-3) */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-2 mb-4 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase font-condensed">
              Editor's Picks
            </h2>
          </div>

          {/* 2 Vertical Cards */}
          <div className="flex flex-col gap-6 flex-1">
            <article className="group flex flex-col">
              <div 
                onClick={() => onSelectPost(aiPost)}
                className="aspect-[4/3] overflow-hidden bg-slate-200 cursor-pointer shadow-xs rounded-xs mb-2.5"
              >
                <img
                  src={aiPost.image}
                  alt={aiPost.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Title */}
              <h4 
                onClick={() => onSelectPost(aiPost)}
                className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors cursor-pointer leading-snug line-clamp-3 mb-1 font-condensed"
              >
                {aiPost.title}
              </h4>

              <div className="text-[11px] text-slate-500 font-medium">
                {aiPost.author} · {aiPost.date}
              </div>
            </article>

            <article className="group flex flex-col pt-3 border-t border-slate-100">
              <div 
                onClick={() => onSelectPost(evPost)}
                className="aspect-[4/3] overflow-hidden bg-slate-200 cursor-pointer shadow-xs rounded-xs mb-2.5"
              >
                <img
                  src={evPost.image}
                  alt={evPost.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Title */}
              <h4 
                onClick={() => onSelectPost(evPost)}
                className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors cursor-pointer leading-snug line-clamp-3 mb-1 font-condensed"
              >
                {evPost.title}
              </h4>

              <div className="text-[11px] text-slate-500 font-medium">
                {evPost.author} · {evPost.date}
              </div>
            </article>
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMN 4: TRENDING NOW (lg:col-span-2 xl:col-span-3) */}
        {/* ============================================================== */}
        <div className="lg:col-span-2 xl:col-span-3 flex flex-col">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-2 mb-4 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 uppercase font-condensed">
              Trending Stories
            </h2>
          </div>

          {/* Compact List Items without categories */}
          <div className="flex flex-col divide-y divide-slate-100 flex-1">
            {trendingList.map((item, index) => (
              <article
                key={index}
                onClick={() => onSelectPost(item.post)}
                className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  {/* Headline */}
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2 mb-1 font-condensed">
                    {item.post.title}
                  </h4>

                  {/* Date */}
                  <div className="text-[11px] text-slate-400">
                    {item.post.date}
                  </div>
                </div>

                {/* Thumbnail on Right */}
                <div className="w-16 h-14 sm:w-18 sm:h-16 shrink-0 overflow-hidden bg-slate-200 rounded-xs shadow-xs">
                  <img
                    src={item.post.image}
                    alt={item.post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
