import React from 'react';
import { Post, ViewMode } from '../types';

interface FooterProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onSelectCategory?: (category: string) => void;
  onNavigate: (view: ViewMode) => void;
  onOpenSubscribe: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  posts,
  onSelectPost,
  onNavigate,
  onOpenSubscribe,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const recentPosts = posts.slice(0, 3);

  return (
    <footer className="bg-[#0b0f19] text-slate-300 border-t-4 border-red-600 mt-12 select-none">
      {/* Simplified Footer Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {/* Column 1: About Chombezo */}
          <div className="space-y-4">
            <h3 className="text-2xl font-extrabold text-white font-condensed tracking-tight">
              CHOMBEZO
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              CHOMBEZO ni jukwaa la habari, burudani, video, picha na simulizi mbalimbali.
            </p>
            <div className="pt-1">
              <button
                onClick={onOpenSubscribe}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 transition-colors cursor-pointer rounded-xs"
              >
                Join Newsletter
              </button>
            </div>
          </div>

          {/* Column 2: Recent Stories */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white pb-2 mb-4 border-b-2 border-slate-800 relative after:absolute after:bottom-[-2px] after:left-0 after:w-10 after:h-[2px] after:bg-red-600 font-condensed">
              Recent Stories
            </h4>
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="flex items-center gap-3 group cursor-pointer"
                >
                  <div className="w-12 h-12 shrink-0 overflow-hidden bg-slate-800 rounded-xs">
                    <img
                      src={post.image}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold text-slate-200 group-hover:text-red-500 transition-colors line-clamp-2 leading-tight">
                      {post.title}
                    </h5>
                    <span className="text-[10px] text-slate-500">{post.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Customer Care & Direct WhatsApp */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white pb-2 mb-4 border-b-2 border-slate-800 relative after:absolute after:bottom-[-2px] after:left-0 after:w-10 after:h-[2px] after:bg-red-600 font-condensed">
              Huduma & Mawasiliano
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Wasiliana nasi kwa maswali ya matangazo, habari, au kuagiza bidhaa za dukani moja kwa moja.
            </p>
            <div className="pt-1">
              <a
                href="https://wa.me/255623709042?text=Habari,%20nahitaji%20mawasiliano%20na%20CHOMBEZO"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase px-4 py-2.5 rounded-xs transition-colors"
              >
                <span>WhatsApp: 0623709042</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Bottom Bar */}
      <div className="bg-[#070a10] border-t border-slate-800/80 py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span>CHOMBEZO © 2026. Haki zote zimehifadhiwa.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('contact')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Contact Desk
            </button>
            <span>·</span>
            <button
              onClick={scrollToTop}
              className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Back to top"
            >
              <span>↑ Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
