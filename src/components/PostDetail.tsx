import React, { useState } from 'react';
import { Post, Comment } from '../types';
import { BannerAd } from './BannerAds';
import { ArticleVideo } from './ArticleVideo';

interface PostDetailProps {
  post: Post;
  allPosts: Post[];
  onSelectPost: (post: Post) => void;
  onSelectCategory?: (category: string) => void;
  onAddComment: (postId: string, comment: Comment) => void;
  onNavigateHome: () => void;
}

export const PostDetail: React.FC<PostDetailProps> = ({
  post,
  allPosts,
  onSelectPost,
  onAddComment,
  onNavigateHome,
}) => {
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const relatedPosts = allPosts
    .filter((p) => p.id !== post.id)
    .slice(0, 3);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;

    const newComment: Comment = {
      id: 'c_' + Date.now(),
      author: commentName.trim(),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) + ' at ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      content: commentText.trim(),
    };

    onAddComment(post.id, newComment);
    setCommentName('');
    setCommentEmail('');
    setCommentText('');
    setCommentSubmitted(true);
    setTimeout(() => setCommentSubmitted(false), 5000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <article className="max-w-4xl mx-auto bg-white p-6 sm:p-10 border border-slate-200 shadow-xs select-none">
      {/* Breadcrumb Navigation without categories */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
        <button
          onClick={onNavigateHome}
          className="hover:text-red-600 transition-colors cursor-pointer"
        >
          Home
        </button>
        <span>/</span>
        <span className="text-slate-400 truncate max-w-xs">{post.title}</span>
      </nav>

      {/* Post Title */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight mb-4 font-condensed">
        {post.title}
      </h1>

      {/* Author & Publication Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-slate-100 text-xs text-slate-500 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs uppercase">
            A
          </div>
          <div>
            <div className="font-bold text-slate-900">{post.author}</div>
            <div className="text-[11px] text-slate-400">Published on {post.date}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span>⏱ {post.readTime}</span>
          <span>👁 {post.views.toLocaleString()} views</span>
          <span>💬 {post.comments.length} comments</span>
        </div>
      </div>

      {/* Featured Image */}
      <div className="aspect-[16/10] overflow-hidden bg-slate-100 rounded-xs shadow-sm mb-6">
        <img
          src={post.image}
          alt={post.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Mid Banner Ad in Article */}
      <BannerAd type="mid" className="my-6" />

      {/* Post Lead Paragraph with Drop Cap */}
      <div className="font-serif-body text-slate-800 text-base sm:text-lg leading-relaxed space-y-5">
        {post.content.map((paragraph, idx) => (
          <p
            key={idx}
            className={
              idx === 0
                ? 'first-letter:text-5xl first-letter:font-bold first-letter:text-slate-900 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-condensed'
                : ''
            }
          >
            {paragraph}
          </p>
        ))}

        {post.additionalImages?.map((imageUrl, index) => (
          <figure key={`${imageUrl}-${index}`} className="my-8">
            <img
              src={imageUrl}
              alt={`${post.title} - image ${index + 2}`}
              referrerPolicy="no-referrer"
              loading="lazy"
              className="w-full rounded-xs object-cover"
            />
          </figure>
        ))}

        {post.videoUrl && <ArticleVideo url={post.videoUrl} title={post.title} />}

        {/* Pull Quote */}
        {post.pullQuote && (
          <blockquote className="my-8 border-l-4 border-red-600 bg-red-50/40 p-5 italic text-slate-800 font-serif text-lg sm:text-xl leading-relaxed">
            "{post.pullQuote}"
            <cite className="block text-xs font-sans not-italic text-slate-500 mt-2 uppercase tracking-wider font-semibold">
              — CHOMBEZO
            </cite>
          </blockquote>
        )}

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xs my-6 not-italic font-sans text-xs sm:text-sm text-slate-700">
          <h4 className="font-bold text-slate-900 uppercase tracking-wide mb-2 font-condensed text-base">
            Key Editorial Takeaways
          </h4>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>High-performance editorial layout designed for sub-second Core Web Vitals.</li>
            <li>Optimized typography and visual pacing for long-form reading comfort.</li>
            <li>Direct contact and order integration via WhatsApp support.</li>
          </ul>
        </div>
      </div>

      {/* Social Share Strip */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-700 font-condensed">
          Share This Story:
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/255623709042?text=${encodeURIComponent('Soma hii makala: ' + post.title)}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xs transition-colors flex items-center gap-1.5"
          >
            <span>WhatsApp</span>
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white text-xs font-semibold rounded-xs transition-colors flex items-center gap-1.5"
          >
            <span>X / Twitter</span>
          </a>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xs border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>{copiedLink ? 'Copied URL!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>

      {/* Author Bio Box */}
      <div className="mt-10 p-6 bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xl shrink-0">
          AF
        </div>
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h4 className="font-bold text-slate-900 text-base font-condensed">
              {post.author}
            </h4>
            <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-bold uppercase">
              Author
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Admin husimamia uchapishaji wa maudhui kwenye CHOMBEZO.
          </p>
        </div>
      </div>

      {/* Bottom In-Content Banner Ad */}
      <BannerAd type="bottom" className="my-8" />

      {/* Related Posts without categories */}
      {relatedPosts.length > 0 && (
        <section className="mt-10 pt-8 border-t border-slate-200">
          <h3 className="text-lg font-bold uppercase tracking-wider text-slate-900 pb-2 mb-6 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600 font-condensed">
            Related Stories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedPosts.map((related) => (
              <div
                key={related.id}
                onClick={() => onSelectPost(related)}
                className="group cursor-pointer flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-200 rounded-xs mb-2">
                  <img
                    src={related.image}
                    alt={related.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug">
                  {related.title}
                </h4>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments Section */}
      <section className="mt-12 pt-8 border-t border-slate-200">
        <h3 className="text-lg font-bold uppercase tracking-wider text-slate-900 pb-2 mb-6 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600 font-condensed">
          Comments ({post.comments.length})
        </h3>

        {/* Existing Comments List */}
        {post.comments.length > 0 ? (
          <div className="space-y-4 mb-8 divide-y divide-slate-100">
            {post.comments.map((comment) => (
              <div key={comment.id} className="pt-4 first:pt-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    {comment.author}
                  </span>
                  <span className="text-[11px] text-slate-400">{comment.date}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic mb-6">No comments yet. Be the first to share your thoughts!</p>
        )}

        {/* Leave a Comment Form */}
        <div className="bg-slate-50 p-6 border border-slate-200 rounded-xs">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-2 font-condensed">
            Leave a Reply
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Your email address will not be published. Required fields are marked *
          </p>

          {commentSubmitted && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded">
              ✓ Thank you! Your comment has been posted successfully.
            </div>
          )}

          <form onSubmit={handleCommentSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-hidden focus:border-red-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={commentEmail}
                  onChange={(e) => setCommentEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-hidden focus:border-red-600 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Comment *
              </label>
              <textarea
                required
                rows={4}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write your comment here..."
                className="w-full px-3 py-2 text-xs border border-slate-300 focus:outline-hidden focus:border-red-600 bg-white"
              />
            </div>

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 transition-colors cursor-pointer"
            >
              Post Comment
            </button>
          </form>
        </div>
      </section>
    </article>
  );
};
