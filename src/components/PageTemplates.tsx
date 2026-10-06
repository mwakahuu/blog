import React, { useState } from 'react';
import { Post } from '../types';
import { Sidebar } from './Sidebar';

interface PageTemplateProps {
  template: 'author' | 'docs' | 'support' | 'contact' | 'category' | 'go-with-wp' | 'right-sidebar' | 'left-sidebar' | 'full-width';
  posts: Post[];
  activeCategory?: string;
  onSelectPost: (post: Post) => void;
  onSelectCategory: (category: string) => void;
  onSearch: (query: string) => void;
  onOpenSubscribe: () => void;
  onNavigateHome: () => void;
}

export const PageTemplates: React.FC<PageTemplateProps> = ({
  template,
  posts,
  activeCategory = 'All',
  onSelectPost,
  onSelectCategory,
  onSearch,
  onOpenSubscribe,
  onNavigateHome,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  // Category filtering
  const filteredPosts = activeCategory === 'All'
    ? posts
    : posts.filter((p) => p.categories.includes(activeCategory));

  // Render Category Archive
  if (template === 'category') {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 sm:p-8 border border-slate-200 mb-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-red-600 uppercase tracking-widest font-condensed">
                Category Archive
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-condensed mt-1">
                {activeCategory} Articles
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Showing {filteredPosts.length} published stories in {activeCategory}
              </p>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              {['All', 'Business', 'Tech', 'Health', 'Science', 'Sports', 'Stories', 'World'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-xs transition-colors cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="bg-white border border-slate-200 p-4 shadow-xs flex flex-col group cursor-pointer"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-slate-200 rounded-xs mb-3">
                    <img
                      src={post.image}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.categories.map((c) => (
                      <span key={c} className="text-[10px] font-bold text-red-600 uppercase">
                        {c}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2 mb-2 font-condensed">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{post.author}</span>
                    <span>{post.date}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <Sidebar
              posts={posts}
              onSelectPost={onSelectPost}
              onSelectCategory={onSelectCategory}
              onSearch={onSearch}
              onOpenSubscribe={onOpenSubscribe}
            />
          </div>
        </div>
      </div>
    );
  }

  // Author Profile Page
  if (template === 'author') {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-6 sm:p-10 border border-slate-200 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-3xl shadow-md shrink-0">
              AF
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-condensed">
                  AF themes
                </h1>
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 uppercase tracking-wider rounded-xs">
                  Theme Author & Editorial Staff
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-3xl">
                AF themes creates high-performance WordPress themes and Gutenberg block systems specifically engineered for news portals, online magazines, and niche blogs. Author of MagazineSpare and NewSpare child themes.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-600">
                <span>📍 Official AF themes HQ</span>
                <span>·</span>
                <span>🌐 <a href="https://afthemes.com/products/magazinespare/" target="_blank" rel="noreferrer" className="text-red-600 hover:underline">afthemes.com</a></span>
                <span>·</span>
                <span>📰 {posts.length} Published Articles</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 pb-2 mb-6 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600 font-condensed">
              Articles by AF themes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {posts.map((post) => (
                <article
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="bg-white border border-slate-200 p-4 shadow-xs flex flex-col group cursor-pointer"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-slate-200 rounded-xs mb-3">
                    <img
                      src={post.image}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2 mb-2 font-condensed">
                    {post.title}
                  </h3>
                  <div className="mt-auto text-[11px] text-slate-400">
                    {post.date} · {post.readTime}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <Sidebar
              posts={posts}
              onSelectPost={onSelectPost}
              onSelectCategory={onSelectCategory}
              onSearch={onSearch}
              onOpenSubscribe={onOpenSubscribe}
            />
          </div>
        </div>
      </div>
    );
  }

  // Docs Page (Reusing material data from README.txt)
  if (template === 'docs') {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-8 border border-slate-200 shadow-xs mb-8">
          <div className="max-w-3xl">
            <div className="text-xs font-bold text-red-600 uppercase tracking-widest font-condensed">
              Official Theme Documentation
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-condensed mt-1 mb-3">
              MagazineSpare Documentation & Integration Guide
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              MagazineSpare is a high-performance, lightweight Full Site Editing (FSE) child theme for NewSpare, specifically engineered for professional news portals, online magazines, and niche blogs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white p-8 border border-slate-200 shadow-xs space-y-8">
            {/* Section 1: Overview */}
            <section>
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 pb-2 mb-4 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600 font-condensed">
                Theme Specifications
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-700">Theme Name:</div>
                  <div className="text-slate-900 font-mono">MagazineSpare</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-700">Parent Theme:</div>
                  <div className="text-slate-900 font-mono">NewSpare</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-700">Version & Release:</div>
                  <div className="text-slate-900 font-mono">2.0.1 (May 11, 2026)</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-700">License:</div>
                  <div className="text-slate-900 font-mono">GNU GPL v2 or later</div>
                </div>
              </div>
            </section>

            {/* Section 2: Installation steps from README */}
            <section>
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 pb-2 mb-4 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600 font-condensed">
                Installation & Starter Sites Setup
              </h2>
              <ol className="list-decimal list-inside space-y-3 text-xs sm:text-sm text-slate-600">
                <li className="pl-2">
                  <strong className="text-slate-900">Dashboard Access:</strong> In your WordPress dashboard, go to <span className="font-mono bg-slate-100 px-1 py-0.5">Appearance &gt; Themes</span> and click <span className="font-mono bg-slate-100 px-1 py-0.5">Add New</span>.
                </li>
                <li className="pl-2">
                  <strong className="text-slate-900">Upload Theme:</strong> Click on <span className="font-mono bg-slate-100 px-1 py-0.5">Upload Theme</span>, select the <span className="font-mono bg-slate-100 px-1 py-0.5">magazinespare.zip</span> file from your computer, and click <span className="font-mono bg-slate-100 px-1 py-0.5">Install Now</span>.
                </li>
                <li className="pl-2">
                  <strong className="text-slate-900">Activate Theme:</strong> Click Activate to start using the MagazineSpare theme.
                </li>
                <li className="pl-2">
                  <strong className="text-slate-900">Import Demo Content:</strong> Go to <span className="font-mono bg-slate-100 px-1 py-0.5">Starter Sites</span> under the MagazineSpare menu in your dashboard to choose from 50+ one-click starter layouts.
                </li>
                <li className="pl-2">
                  <strong className="text-slate-900">Import Block Patterns:</strong> Go to <span className="font-mono bg-slate-100 px-1 py-0.5">Block Patterns</span> under the MagazineSpare menu for news widgets and grid modules.
                </li>
              </ol>
            </section>

            {/* Section 3: Plugin Compatibility from README */}
            <section>
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 pb-2 mb-4 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600 font-condensed">
                Supported Plugins & Ecosystem
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="p-2.5 border border-slate-200 bg-slate-50 flex items-start gap-2">
                  <span className="text-red-600 font-bold">✓</span>
                  <div><strong>Gutenberg:</strong> Advanced block patterns and full site editing.</div>
                </div>
                <div className="p-2.5 border border-slate-200 bg-slate-50 flex items-start gap-2">
                  <span className="text-red-600 font-bold">✓</span>
                  <div><strong>Elementor:</strong> Compatible with template kits and widgets.</div>
                </div>
                <div className="p-2.5 border border-slate-200 bg-slate-50 flex items-start gap-2">
                  <span className="text-red-600 font-bold">✓</span>
                  <div><strong>WooCommerce:</strong> Complete product storefront & cart integration.</div>
                </div>
                <div className="p-2.5 border border-slate-200 bg-slate-50 flex items-start gap-2">
                  <span className="text-red-600 font-bold">✓</span>
                  <div><strong>Yoast SEO:</strong> Enhanced meta tag structured data & breadcrumbs.</div>
                </div>
                <div className="p-2.5 border border-slate-200 bg-slate-50 flex items-start gap-2">
                  <span className="text-red-600 font-bold">✓</span>
                  <div><strong>Contact Form 7:</strong> Contact forms and interactive user touchpoints.</div>
                </div>
                <div className="p-2.5 border border-slate-200 bg-slate-50 flex items-start gap-2">
                  <span className="text-red-600 font-bold">✓</span>
                  <div><strong>WPML & WeGlot:</strong> Native RTL & multilingual translation ready.</div>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4">
            <Sidebar
              posts={posts}
              onSelectPost={onSelectPost}
              onSelectCategory={onSelectCategory}
              onSearch={onSearch}
              onOpenSubscribe={onOpenSubscribe}
            />
          </div>
        </div>
      </div>
    );
  }

  // Support & FAQ Page (reusing exact material data from README.txt)
  if (template === 'support') {
    const faqs = [
      {
        q: 'Does this theme have Starter Sites?',
        a: 'Yes, MagazineSpare has 50+ dynamic, lightweight, and multipurpose starter sites available with one-click demo import.'
      },
      {
        q: 'Does this theme support Gutenberg Editor?',
        a: 'Yes, MagazineSpare is fully compatible with Gutenberg Editor and includes curated block patterns for news grids, breaking banners, and post hero layouts.'
      },
      {
        q: 'Does this theme support Elementor Page Builder?',
        a: 'Yes, MagazineSpare is compatible with Elementor Page Builder, Brizy, and Beaver Builder with custom template kits.'
      },
      {
        q: 'What are the performance specifications?',
        a: 'Fully optimized for Core Web Vitals and 2026 performance standards, ensuring lightning-fast sub-second load times and 0 layout shifts for SEO rankings.'
      },
      {
        q: 'Is WooCommerce supported for digital magazines and merch?',
        a: 'Yes, full WooCommerce integration is included for digital subscriptions, physical publications, and merchandise storefronts.'
      },
    ];

    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-8 border border-slate-200 shadow-xs mb-8">
          <div className="text-xs font-bold text-red-600 uppercase tracking-widest font-condensed">
            Customer Support Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-condensed mt-1 mb-2">
            MagazineSpare Help & Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            Need assistance setting up your news portal or importing starter sites? Browse our frequently asked questions or submit an official support ticket.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* FAQ Accordion */}
            <div className="bg-white p-6 sm:p-8 border border-slate-200 shadow-xs">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 pb-2 mb-6 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600 font-condensed">
                Frequently Asked Questions
              </h2>
              <div className="divide-y divide-slate-200">
                {faqs.map((faq, index) => (
                  <div key={index} className="py-4 first:pt-0 last:pb-0">
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full flex items-center justify-between text-left text-sm sm:text-base font-bold text-slate-900 hover:text-red-600 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <span className="text-red-600 ml-4 font-mono text-lg">
                        {openFaq === index ? '−' : '+'}
                      </span>
                    </button>
                    {openFaq === index && (
                      <div className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in duration-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Ticket Submission Form */}
            <div className="bg-white p-6 sm:p-8 border border-slate-200 shadow-xs">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 pb-2 mb-4 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600 font-condensed">
                Submit a Support Ticket
              </h2>

              {ticketSubmitted ? (
                <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded">
                  ✓ Ticket submitted! Our AF themes technical team will respond to your inquiry within 24 hours.
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setTicketSubmitted(true);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        License Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Inquiry Topic
                    </label>
                    <select className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50">
                      <option>Starter Sites Import</option>
                      <option>Full Site Editing (FSE) & Gutenberg Patterns</option>
                      <option>WooCommerce Shop Setup</option>
                      <option>Core Web Vitals & Speed Optimization</option>
                      <option>Other Question</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Message Details *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Please describe your setup and how we can assist..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 transition-colors cursor-pointer"
                  >
                    Submit Ticket
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <Sidebar
              posts={posts}
              onSelectPost={onSelectPost}
              onSelectCategory={onSelectCategory}
              onSearch={onSearch}
              onOpenSubscribe={onOpenSubscribe}
            />
          </div>
        </div>
      </div>
    );
  }

  // Go With WP Showcase Page
  if (template === 'go-with-wp') {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 sm:p-12 border border-slate-700 shadow-md mb-8">
          <div className="max-w-3xl">
            <span className="text-red-500 font-bold uppercase tracking-widest text-xs font-condensed">
              Why Choose MagazineSpare on WordPress
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-condensed tracking-tight mt-2 mb-4">
              The Modern Publishing Engine for Professional Media
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Engineered as a lightweight Full Site Editing (FSE) child theme for NewSpare, MagazineSpare removes technical hurdles and empowers publishers to build sophisticated media hubs with zero coding required.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 border border-slate-200 shadow-xs">
            <div className="text-red-600 text-2xl font-bold font-condensed mb-2">01. 100% Full Site Editing</div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Native Gutenberg Block Control</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Design headers, footers, post grids, and single story layouts visually using the WordPress Site Editor without touching template code.
            </p>
          </div>

          <div className="bg-white p-6 border border-slate-200 shadow-xs">
            <div className="text-red-600 text-2xl font-bold font-condensed mb-2">02. 2026 Core Web Vitals</div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Sub-Second Speed Benchmarks</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              No bloated libraries or render-blocking scripts. Engineered for 99+ mobile and desktop Google PageSpeed scores out of the box.
            </p>
          </div>

          <div className="bg-white p-6 border border-slate-200 shadow-xs">
            <div className="text-red-600 text-2xl font-bold font-condensed mb-2">03. 50+ Starter Sites</div>
            <h3 className="text-base font-bold text-slate-900 mb-2">One-Click Demo Importer</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Deploy technology portals, lifestyle blogs, newspaper broadsheets, or niche magazines instantly with pre-populated demo content and widgets.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 border border-slate-200 shadow-xs text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 font-condensed mb-2">
            Ready to Build Your News Portal?
          </h2>
          <p className="text-xs text-slate-600 mb-6">
            Explore documentation and download starter themes directly from the official AF themes catalog.
          </p>
          <a
            href="https://afthemes.com/products/magazinespare/"
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 transition-colors shadow-sm"
          >
            Explore MagazineSpare on afthemes.com →
          </a>
        </div>
      </div>
    );
  }

  // Contact Page
  if (template === 'contact') {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-8 border border-slate-200 shadow-xs mb-8">
          <div className="text-xs font-bold text-red-600 uppercase tracking-widest font-condensed">
            Get in Touch
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-condensed mt-1 mb-2">
            Need a Website?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            I build professional websites for businesses, creators, and organizations. Contact me on WhatsApp to discuss your website and get a quote.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white p-8 border border-slate-200 shadow-xs">
            <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 pb-2 mb-6 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600 font-condensed">
              Let&apos;s Build Your Website
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Tell me what kind of website you need, what it should do, and when you need it. I&apos;ll get back to you on WhatsApp to discuss the details and pricing.
            </p>
            <p className="mt-6 text-lg font-bold text-slate-900">WhatsApp: 0623709042</p>
            <a
              href={`https://wa.me/255623709042?text=${encodeURIComponent('Hi, I need a website. Can we discuss the details and pricing?')}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm uppercase tracking-wider px-6 py-3 transition-colors"
            >
              Message me on WhatsApp
            </a>
          </div>

          <div className="lg:col-span-4">
            <Sidebar
              posts={posts}
              onSelectPost={onSelectPost}
              onSelectCategory={onSelectCategory}
              onSearch={onSearch}
              onOpenSubscribe={onOpenSubscribe}
            />
          </div>
        </div>
      </div>
    );
  }

  // Right Sidebar, Left Sidebar, or Full Width Template
  const isLeftSidebar = template === 'left-sidebar';
  const isFullWidth = template === 'full-width';

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title Card */}
      <div className="bg-white p-6 sm:p-8 border border-slate-200 mb-8 shadow-xs">
        <div className="text-xs font-bold text-red-600 uppercase tracking-widest font-condensed">
          Page Template Demonstration
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-condensed mt-1">
          {isLeftSidebar && 'Left Sidebar Page Template'}
          {template === 'right-sidebar' && 'Right Sidebar Page Template'}
          {isFullWidth && 'Full Width Page Template (No Sidebar)'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Native WordPress Full Site Editing layout demonstrating fluid column placement and widgets.
        </p>
      </div>

      <div className={`grid grid-cols-1 ${isFullWidth ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-8`}>
        {/* If Left Sidebar, render sidebar first on desktop */}
        {isLeftSidebar && (
          <div className="lg:col-span-4 order-2 lg:order-1">
            <Sidebar
              posts={posts}
              onSelectPost={onSelectPost}
              onSelectCategory={onSelectCategory}
              onSearch={onSearch}
              onOpenSubscribe={onOpenSubscribe}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className={`${isFullWidth ? 'w-full' : 'lg:col-span-8'} ${isLeftSidebar ? 'order-1 lg:order-2' : ''} bg-white p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6`}>
          <h2 className="text-2xl font-bold text-slate-900 font-condensed">
            Building High Performance Editorial Experiences with Gutenberg Blocks
          </h2>
          <p className="font-serif-body text-slate-700 leading-relaxed text-sm sm:text-base">
            MagazineSpare is engineered to eliminate technical hurdles for publishing hubs. By leveraging the modern Gutenberg block-based layout system, you can craft modular front pages, multi-column feature spreads, and sticky breaking news tickers effortlessly.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
            <div className="p-4 bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-1 font-condensed">
                Flexible Light & Dark Modes
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Adaptive color schemes configured directly in theme.json provide high readability in any lighting environment.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm mb-1 font-condensed">
                RTL & Multilingual Ready
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Full bidirectional right-to-left layout support and seamless compatibility with WPML and WeGlot for global readership.
              </p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900 font-condensed pt-4 border-t border-slate-100">
            Featured Stories in This Template
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {posts.slice(0, 3).map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectPost(p)}
                className="group cursor-pointer flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-200 rounded-xs mb-2">
                  <img
                    src={p.image}
                    alt={p.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2">
                  {p.title}
                </h4>
              </div>
            ))}
          </div>
        </div>

        {/* If Right Sidebar, render sidebar after main content */}
        {template === 'right-sidebar' && (
          <div className="lg:col-span-4">
            <Sidebar
              posts={posts}
              onSelectPost={onSelectPost}
              onSelectCategory={onSelectCategory}
              onSearch={onSearch}
              onOpenSubscribe={onOpenSubscribe}
            />
          </div>
        )}
      </div>
    </div>
  );
};
