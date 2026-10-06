import React, { useState } from 'react';
import { Post, VideoItem, GalleryImage } from '../types';

interface AdminPanelPageProps {
  posts: Post[];
  videos: VideoItem[];
  galleryImages: GalleryImage[];
  requiresAdminAuth: boolean;
  isAdmin: boolean;
  authLoading: boolean;
  contentError: string;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignOut: () => void | Promise<unknown>;
  onAddPost: (post: Post) => Promise<void>;
  onUpdatePost: (post: Post) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onAddVideo: (video: VideoItem) => Promise<void>;
  onUpdateVideo: (video: VideoItem) => Promise<void>;
  onDeleteVideo: (videoId: string) => Promise<void>;
  onAddGalleryImage: (image: GalleryImage) => Promise<void>;
  onDeleteGalleryImage: (imageId: string) => Promise<void>;
}

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({
  posts,
  videos,
  galleryImages,
  requiresAdminAuth,
  isAdmin,
  authLoading,
  contentError,
  onSignIn,
  onSignOut,
  onAddPost,
  onUpdatePost,
  onDeletePost,
  onAddVideo,
  onUpdateVideo,
  onDeleteVideo,
  onAddGalleryImage,
  onDeleteGalleryImage,
}) => {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authPending, setAuthPending] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthPending(true);
    setAuthError('');
    try {
      await onSignIn(adminEmail.trim(), adminPassword);
      setAdminPassword('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign-in failed.');
    } finally {
      setAuthPending(false);
    }
  };

  // Destination selection: 'articles' | 'videos' | 'gallery'
  const [postDestination, setPostDestination] = useState<'articles' | 'videos' | 'gallery'>('articles');

  // Article State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleImageLink, setArticleImageLink] = useState('');
  const [articleAdditionalImageLinks, setArticleAdditionalImageLinks] = useState('');
  const [articleVideoUrl, setArticleVideoUrl] = useState('');
  const [articleExcerpt, setArticleExcerpt] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleAuthor, setArticleAuthor] = useState('AF themes');
  const [articlePullQuote, setArticlePullQuote] = useState('');
  const [articleSuccessMsg, setArticleSuccessMsg] = useState('');

  // Video State
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoThumbnailLink, setVideoThumbnailLink] = useState('');
  const [videoStreamUrl, setVideoStreamUrl] = useState('https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/highest.mp4');
  const [videoDuration, setVideoDuration] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoSuccessMsg, setVideoSuccessMsg] = useState('');

  // Gallery Image State
  const [galleryImageLink, setGalleryImageLink] = useState('');
  const [gallerySuccessMsg, setGallerySuccessMsg] = useState('');

  if (requiresAdminAuth && !isAdmin) {
    return (
      <section className="max-w-lg mx-auto px-4 py-16">
        <div className="border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 font-condensed">Admin sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in with the admin username and password configured in the server&apos;s .env file.</p>
          {authError && <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{authError}</p>}
          {authLoading ? (
            <p className="mt-6 text-sm text-slate-500">Checking your session...</p>
          ) : (
            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Username
                <input
                  type="text"
                  autoComplete="username"
                  required
                  value={adminEmail}
                  onChange={(event) => setAdminEmail(event.target.value)}
                  className="mt-1 w-full border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  className="mt-1 w-full border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal"
                />
              </label>
              <button
                type="submit"
                disabled={authPending}
                className="w-full bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {authPending ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          )}
        </div>
      </section>
    );
  }

  // Handle Article Submit
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    if (!articleTitle.trim() || !articleImageLink.trim() || !articleContent.trim()) {
      alert('Please fill out Title, Image Link URL, and Content.');
      return;
    }

    const paragraphs = articleContent
      .split('\n\n')
      .map((p) => p.trim())
      .filter(Boolean);

    try {
    if (editingPostId) {
      const existing = posts.find((p) => p.id === editingPostId);
      if (existing) {
        const updated: Post = {
          ...existing,
          title: articleTitle.trim(),
          image: articleImageLink.trim(),
          additionalImages: articleAdditionalImageLinks.split('\n').map((url) => url.trim()).filter(Boolean),
          videoUrl: articleVideoUrl.trim() || undefined,
          excerpt: articleExcerpt.trim() || paragraphs[0].slice(0, 160) + '...',
          content: paragraphs,
          author: articleAuthor.trim() || 'AF themes',
          pullQuote: articlePullQuote.trim() || undefined,
        };
        await onUpdatePost(updated);
        setArticleSuccessMsg('✓ Article updated successfully!');
      }
    } else {
      const newPost: Post = {
        id: 'post_' + Date.now(),
        title: articleTitle.trim(),
        slug: articleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        categories: [],
        author: articleAuthor.trim() || 'AF themes',
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        readTime: '6 min read',
        image: articleImageLink.trim(),
        additionalImages: articleAdditionalImageLinks.split('\n').map((url) => url.trim()).filter(Boolean),
        videoUrl: articleVideoUrl.trim() || undefined,
        excerpt: articleExcerpt.trim() || paragraphs[0].slice(0, 160) + '...',
        content: paragraphs,
        pullQuote: articlePullQuote.trim() || undefined,
        views: 1,
        comments: [],
      };
      await onAddPost(newPost);
      setArticleSuccessMsg('✓ Long-form story published live to Articles page!');
    }

    setEditingPostId(null);
    setArticleTitle('');
    setArticleImageLink('');
    setArticleAdditionalImageLinks('');
    setArticleVideoUrl('');
    setArticleExcerpt('');
    setArticleContent('');
    setArticlePullQuote('');
    setTimeout(() => setArticleSuccessMsg(''), 4000);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to save article.');
    }
  };

  // Handle Video Submit
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    if (!videoTitle.trim() || !videoThumbnailLink.trim() || !videoDescription.trim()) {
      alert('Please fill out Title, Video Thumbnail Link, and Description.');
      return;
    }

    try {
    if (editingVideoId) {
      const existing = videos.find((v) => v.id === editingVideoId);
      if (existing) {
        const updated: VideoItem = {
          ...existing,
          title: videoTitle.trim(),
          thumbnail: videoThumbnailLink.trim(),
          videoUrl: videoStreamUrl.trim() || 'https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/highest.mp4',
          duration: videoDuration.trim() || '12:00',
          description: videoDescription.trim(),
        };
        await onUpdateVideo(updated);
        setVideoSuccessMsg('✓ Video updated successfully!');
      }
    } else {
      const newVideo: VideoItem = {
        id: 'vid_' + Date.now(),
        title: videoTitle.trim(),
        duration: videoDuration.trim() || '10:00',
        views: '1K views',
        uploadDate: 'Just now',
        thumbnail: videoThumbnailLink.trim(),
        videoUrl: videoStreamUrl.trim() || 'https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/highest.mp4',
        channelName: 'MagazineSpare Video',
        description: videoDescription.trim(),
        likes: '1.2K',
      };
      await onAddVideo(newVideo);
      setVideoSuccessMsg('✓ New video published live to Videos page!');
    }

    setEditingVideoId(null);
    setVideoTitle('');
    setVideoThumbnailLink('');
    setVideoDuration('');
    setVideoDescription('');
    setTimeout(() => setVideoSuccessMsg(''), 4000);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to save video.');
    }
  };

  // Handle Gallery Image Submit
  const handleSaveGalleryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    if (!galleryImageLink.trim()) {
      alert('Please enter an image link URL.');
      return;
    }

    const newImg: GalleryImage = {
      id: 'g_' + Date.now(),
      url: galleryImageLink.trim(),
    };

    try {
      await onAddGalleryImage(newImg);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to save gallery image.');
      return;
    }
    setGalleryImageLink('');
    setGallerySuccessMsg('✓ New photo added to Gallery page successfully!');
    setTimeout(() => setGallerySuccessMsg(''), 4000);
  };

  return (
    <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-10 select-none">
      {/* Executive Unique Header - No Ads in Admin Panel */}
      <div className="bg-[#0b1120] text-white p-8 sm:p-10 border border-slate-800 shadow-xl rounded-sm mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs sm:text-sm font-black tracking-widest text-emerald-400 uppercase font-mono">
                ADMINISTRATION & PUBLISHING PORTAL
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-condensed">
              Editorial Content Manager
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Choose the target page for your content. Publish long-form stories to <strong>Articles</strong>, stream video embeds to <strong>Videos</strong>, or add pure frameless photos to <strong>Gallery</strong> using direct link URLs.
            </p>
          </div>

          <div className="bg-slate-900/90 p-4 border border-slate-700 rounded text-xs sm:text-sm font-mono text-slate-300 space-y-1">
            <div className="text-slate-400 uppercase text-[11px] font-bold">Live Inventory</div>
            <div>Articles: <strong className="text-white">{posts.length}</strong></div>
            <div>Videos: <strong className="text-white">{videos.length}</strong></div>
            <div>Gallery Photos: <strong className="text-white">{galleryImages.length}</strong></div>
            {requiresAdminAuth && (
              <button onClick={() => void onSignOut()} className="mt-2 text-emerald-300 underline underline-offset-2">
                Sign out
              </button>
            )}
          </div>
        </div>

        {requiresAdminAuth && contentError && (
          <div role="alert" className="mt-6 border border-amber-700 bg-amber-950/60 p-4 text-sm text-amber-100">
            Could not connect to the local content database: {contentError}
          </div>
        )}
        {actionError && (
          <div role="alert" className="mt-6 border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            Could not save content: {actionError}
          </div>
        )}

        {/* Target Destination Switcher */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold uppercase tracking-wider text-slate-400 font-condensed">
            Select Destination Page:
          </span>

          <button
            onClick={() => setPostDestination('articles')}
            className={`px-5 py-2.5 text-sm sm:text-base font-bold uppercase tracking-wider transition-all cursor-pointer rounded-xs ${
              postDestination === 'articles'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            📰 Articles Page (Long Stories)
          </button>

          <button
            onClick={() => setPostDestination('videos')}
            className={`px-5 py-2.5 text-sm sm:text-base font-bold uppercase tracking-wider transition-all cursor-pointer rounded-xs ${
              postDestination === 'videos'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            🎬 Videos Page (Web Video Player)
          </button>

          <button
            onClick={() => setPostDestination('gallery')}
            className={`px-5 py-2.5 text-sm sm:text-base font-bold uppercase tracking-wider transition-all cursor-pointer rounded-xs ${
              postDestination === 'gallery'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            🖼 Photo Gallery (Images Only)
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. ARTICLES POSTING (LONG STORIES) */}
      {/* ==================================================================== */}
      {postDestination === 'articles' && (
        <div className="space-y-10">
          <div className="bg-white p-8 sm:p-12 border border-slate-200 shadow-md">
            <div className="flex items-center justify-between pb-3 mb-6 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-20 after:h-[3px] after:bg-red-600">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-condensed">
                {editingPostId ? 'Edit Article Story' : 'Publish Long Story to Articles Page'}
              </h2>
              <span className="text-xs sm:text-sm font-semibold text-slate-500 font-mono">
                Direct Link Input (No File Upload)
              </span>
            </div>

            {articleSuccessMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm sm:text-base font-bold rounded">
                {articleSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveArticle} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                    Story Headline / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    placeholder="Enter full headline..."
                    className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                    Featured Image Link URL * (No File Upload)
                  </label>
                  <input
                    type="url"
                    required
                    value={articleImageLink}
                    onChange={(e) => setArticleImageLink(e.target.value)}
                    placeholder="https://images.example.com/photo.jpg"
                    className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                    Additional Image Links (Optional)
                  </label>
                  <textarea
                    rows={4}
                    value={articleAdditionalImageLinks}
                    onChange={(e) => setArticleAdditionalImageLinks(e.target.value)}
                    placeholder={'https://images.example.com/photo-2.jpg\nhttps://images.example.com/photo-3.jpg'}
                    className="w-full px-4 py-3 text-sm border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50 font-mono"
                  />
                  <p className="mt-1 text-xs text-slate-500">Add one public image URL per line. The featured image is shown separately.</p>
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                    Video Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={articleVideoUrl}
                    onChange={(e) => setArticleVideoUrl(e.target.value)}
                    placeholder="YouTube, Vimeo, .mp4 or .m3u8 link"
                    className="w-full px-4 py-3 text-sm border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50 font-mono"
                  />
                  <p className="mt-1 text-xs text-slate-500">The video appears inside the article with playback controls.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                    Author Byline
                  </label>
                  <input
                    type="text"
                    value={articleAuthor}
                    onChange={(e) => setArticleAuthor(e.target.value)}
                    placeholder="AF themes"
                    className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                    Front-Page Teaser Excerpt
                  </label>
                  <input
                    type="text"
                    value={articleExcerpt}
                    onChange={(e) => setArticleExcerpt(e.target.value)}
                    placeholder="Short 1-2 sentence lead summary..."
                    className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                  Long-Form Story Paragraphs * (Enter full essay; separate paragraphs with double Enter)
                </label>
                <textarea
                  required
                  rows={8}
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  placeholder="First full paragraph of story...&#10;&#10;Second deep-dive paragraph...&#10;&#10;Third detailed paragraph..."
                  className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50 font-serif leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                  Editorial Pull Quote (Optional)
                </label>
                <input
                  type="text"
                  value={articlePullQuote}
                  onChange={(e) => setArticlePullQuote(e.target.value)}
                  placeholder="Standout key quote..."
                  className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50 italic"
                />
              </div>

              <div className="flex items-center gap-4 pt-3">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm sm:text-base uppercase tracking-wider px-8 py-3.5 transition-colors cursor-pointer shadow-md"
                >
                  {editingPostId ? 'Update Article' : 'Publish Story to Articles Page'}
                </button>

                {editingPostId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPostId(null);
                      setArticleTitle('');
                      setArticleImageLink('');
                      setArticleAdditionalImageLinks('');
                      setArticleVideoUrl('');
                      setArticleExcerpt('');
                      setArticleContent('');
                      setArticlePullQuote('');
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm sm:text-base px-6 py-3.5 transition-colors cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Existing Articles Table */}
          <div className="bg-white p-8 sm:p-12 border border-slate-200 shadow-md">
            <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-900 mb-6 font-condensed">
              Current Articles Archive ({posts.length} Stories)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 border border-slate-200 divide-y divide-slate-200">
                <thead className="bg-slate-100 text-xs font-bold text-slate-800 uppercase">
                  <tr>
                    <th className="p-4">Cover</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Author</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <img src={post.image} alt="" className="w-16 h-11 object-cover rounded-xs" />
                      </td>
                      <td className="p-4 font-bold text-slate-900 max-w-sm">
                        <div className="line-clamp-1">{post.title}</div>
                      </td>
                      <td className="p-4 text-slate-600">{post.author}</td>
                      <td className="p-4 text-slate-500 font-mono text-xs">{post.date}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingPostId(post.id);
                            setArticleTitle(post.title);
                            setArticleImageLink(post.image);
                            setArticleAdditionalImageLinks((post.additionalImages ?? []).join('\n'));
                            setArticleVideoUrl(post.videoUrl ?? '');
                            setArticleExcerpt(post.excerpt);
                            setArticleContent(post.content.join('\n\n'));
                            setArticleAuthor(post.author);
                            setArticlePullQuote(post.pullQuote || '');
                            window.scrollTo({ top: 350, behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xs cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete: "${post.title}"?`)) {
                              void onDeletePost(post.id).catch((error: unknown) => {
                                setActionError(error instanceof Error ? error.message : 'Unable to delete article.');
                              });
                            }
                          }}
                          className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xs cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. VIDEOS POSTING */}
      {/* ==================================================================== */}
      {postDestination === 'videos' && (
        <div className="space-y-10">
          <div className="bg-white p-8 sm:p-12 border border-slate-200 shadow-md">
            <div className="flex items-center justify-between pb-3 mb-6 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-20 after:h-[3px] after:bg-red-600">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-condensed">
                {editingVideoId ? 'Edit Video Player Entry' : 'Publish Video to Videos Page'}
              </h2>
              <span className="text-xs sm:text-sm font-semibold text-slate-500 font-mono">
                Video.js Direct Stream Link
              </span>
            </div>

            {videoSuccessMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm sm:text-base font-bold rounded">
                {videoSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveVideo} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                    Video Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Enter video documentary title..."
                    className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                    Thumbnail Image Link URL * (No File Upload)
                  </label>
                  <input
                    type="url"
                    required
                    value={videoThumbnailLink}
                    onChange={(e) => setVideoThumbnailLink(e.target.value)}
                    placeholder="https://images.example.com/video-thumbnail.jpg"
                    className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                    Video Stream URL (MP4 / HLS Link) *
                  </label>
                  <input
                    type="url"
                    required
                    value={videoStreamUrl}
                    onChange={(e) => setVideoStreamUrl(e.target.value)}
                    placeholder="https://stream.mux.com/.../highest.mp4"
                    className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                    Duration (e.g. 16:30)
                  </label>
                  <input
                    type="text"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="16:30"
                    className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                  Video Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Detailed documentary description..."
                  className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-4 pt-3">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm sm:text-base uppercase tracking-wider px-8 py-3.5 transition-colors cursor-pointer shadow-md"
                >
                  {editingVideoId ? 'Update Video' : 'Publish Video to Videos Page'}
                </button>

                {editingVideoId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVideoId(null);
                      setVideoTitle('');
                      setVideoThumbnailLink('');
                      setVideoDuration('');
                      setVideoDescription('');
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm sm:text-base px-6 py-3.5 transition-colors cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Existing Videos Table */}
          <div className="bg-white p-8 sm:p-12 border border-slate-200 shadow-md">
            <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-900 mb-6 font-condensed">
              Current Video Catalog ({videos.length} Videos)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700 border border-slate-200 divide-y divide-slate-200">
                <thead className="bg-slate-100 text-xs font-bold text-slate-800 uppercase">
                  <tr>
                    <th className="p-4">Thumbnail</th>
                    <th className="p-4">Title</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {videos.map((vid) => (
                    <tr key={vid.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <img src={vid.thumbnail} alt="" className="w-16 h-11 object-cover rounded-xs" />
                      </td>
                      <td className="p-4 font-bold text-slate-900 max-w-sm">
                        <div className="line-clamp-1">{vid.title}</div>
                      </td>
                      <td className="p-4 text-slate-500 font-mono text-xs">{vid.duration}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingVideoId(vid.id);
                            setVideoTitle(vid.title);
                            setVideoThumbnailLink(vid.thumbnail);
                            setVideoStreamUrl(vid.videoUrl || 'https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/highest.mp4');
                            setVideoDuration(vid.duration);
                            setVideoDescription(vid.description);
                            window.scrollTo({ top: 350, behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xs cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete: "${vid.title}"?`)) {
                              void onDeleteVideo(vid.id).catch((error: unknown) => {
                                setActionError(error instanceof Error ? error.message : 'Unable to delete video.');
                              });
                            }
                          }}
                          className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold rounded-xs cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. PHOTO GALLERY MANAGEMENT (IMAGES ONLY, NO FRAMES, NO TEXT) */}
      {/* ==================================================================== */}
      {postDestination === 'gallery' && (
        <div className="space-y-10">
          <div className="bg-white p-8 sm:p-12 border border-slate-200 shadow-md">
            <div className="flex items-center justify-between pb-3 mb-6 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-20 after:h-[3px] after:bg-red-600">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-condensed">
                Add Photo to Gallery (Link Only)
              </h2>
              <span className="text-xs sm:text-sm font-semibold text-slate-500 font-mono">
                No frames, No titles, No text
              </span>
            </div>

            {gallerySuccessMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm sm:text-base font-bold rounded">
                {gallerySuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveGalleryImage} className="space-y-6">
              <div>
                <label className="block text-sm sm:text-base font-extrabold text-slate-800 uppercase mb-2 font-condensed">
                  Image Direct Link URL * (No File Upload)
                </label>
                <input
                  type="url"
                  required
                  value={galleryImageLink}
                  onChange={(e) => setGalleryImageLink(e.target.value)}
                  placeholder="https://images.example.com/gallery-photo.jpg"
                  className="w-full px-4 py-3 text-sm sm:text-base border border-slate-300 focus:outline-hidden focus:border-red-600 bg-slate-50 font-mono"
                />
                <span className="text-xs text-slate-500 mt-1 block">
                  Paste any public image link. It will instantly appear in the Photo Gallery page in responsive masonry sizes without frames or titles.
                </span>
              </div>

              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm sm:text-base uppercase tracking-wider px-8 py-3.5 transition-colors cursor-pointer shadow-md"
              >
                Add Image to Gallery
              </button>
            </form>
          </div>

          {/* Current Gallery Images Grid with Delete */}
          <div className="bg-white p-8 sm:p-12 border border-slate-200 shadow-md">
            <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-slate-900 mb-6 font-condensed">
              Current Gallery Images ({galleryImages.length} Photos)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {galleryImages.map((img) => (
                <div key={img.id} className="relative group bg-slate-100 aspect-square overflow-hidden border border-slate-200">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <button
                      onClick={() => {
                        void onDeleteGalleryImage(img.id).catch((error: unknown) => {
                          setActionError(error instanceof Error ? error.message : 'Unable to delete gallery image.');
                        });
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase px-3 py-1.5 rounded cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
