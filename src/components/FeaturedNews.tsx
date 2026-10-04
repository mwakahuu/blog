import React from 'react';
import { Post } from '../types';

interface FeaturedNewsProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onSelectCategory?: (category: string) => void;
}

export const FeaturedNews: React.FC<FeaturedNewsProps> = ({
  posts,
  onSelectPost,
}) => {
  if (!posts.length) {
    return null;
  }

  // Display top 5 featured episodes/stories
  const featuredPosts = posts.slice(0, 5);

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-slate-200 select-none">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 mb-6 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600">
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 uppercase font-condensed">
          Simulizi & Makala Zote
        </h2>
      </div>

      {/* 5-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {featuredPosts.map((post) => (
          <article
            key={post.id}
            onClick={() => onSelectPost(post)}
            className="flex flex-col group cursor-pointer"
          >
            {/* Card Image */}
            <div className="aspect-[4/3] overflow-hidden bg-slate-200 rounded-xs shadow-xs mb-3">
              <img
                src={post.image}
                alt={post.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2 mb-2 font-condensed">
              {post.title}
            </h3>

            {/* Meta */}
            <div className="mt-auto pt-1 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="font-medium text-slate-600">{post.author}</span>
              <span>·</span>
              <span>{post.date}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
