/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { POSTS } from './data/posts';
import { VIDEOS } from './data/videos';
import { INITIAL_GALLERY_IMAGES } from './data/gallery';
import { Post, Comment, ViewMode, VideoItem, GalleryImage } from './types';
import { TopBar } from './components/TopBar';
import { Header } from './components/Header';
import { NavBar } from './components/NavBar';
import { TopStoriesTicker } from './components/TopStoriesTicker';
import { MainGrid } from './components/MainGrid';
import { FeaturedNews } from './components/FeaturedNews';
import { PostDetail } from './components/PostDetail';
import { PageTemplates } from './components/PageTemplates';
import { ShopPage } from './components/ShopPage';
import { VideosPage } from './components/VideosPage';
import { ArticlesPage } from './components/ArticlesPage';
import { PhotoGalleryPage } from './components/PhotoGalleryPage';
import { AdminPanelPage } from './components/AdminPanelPage';
import { Footer } from './components/Footer';
import { BannerAd } from './components/BannerAds';
import { SearchModal, SubscribeModal, AdInfoModal } from './components/Modals';
import {
  fetchAdminSession,
  fetchContent,
  importLegacyContent,
  loginAdmin,
  logoutAdmin,
  removeGalleryImage,
  removePost,
  removeVideo,
  saveGalleryImage,
  savePostComment,
  savePost,
  saveVideo,
  type LegacyContent,
} from './contentStore';

const LEGACY_STORAGE_KEYS = {
  posts: 'blog_posts',
  videos: 'blog_videos',
  galleryImages: 'blog_gallery',
} as const;

const readLegacyContent = (): LegacyContent | null => {
  const stored = {
    posts: window.localStorage.getItem(LEGACY_STORAGE_KEYS.posts),
    videos: window.localStorage.getItem(LEGACY_STORAGE_KEYS.videos),
    galleryImages: window.localStorage.getItem(LEGACY_STORAGE_KEYS.galleryImages),
  };
  if (Object.values(stored).every((value) => value === null)) return null;

  const parseArray = <T,>(value: string | null, key: string): T[] => {
    if (value === null) return [];
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error(`Stored ${key} data is not a list.`);
    return parsed as T[];
  };

  return {
    posts: parseArray<Post>(stored.posts, 'article'),
    videos: parseArray<VideoItem>(stored.videos, 'video'),
    galleryImages: parseArray<GalleryImage>(stored.galleryImages, 'gallery'),
  };
};

export default function App() {
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [videos, setVideos] = useState<VideoItem[]>(VIDEOS);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(INITIAL_GALLERY_IMAGES);
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState('');

  useEffect(() => {
    let active = true;

    fetchContent()
      .then((content) => {
        if (!active) return;
        setPosts(content.posts);
        setVideos(content.videos);
        setGalleryImages(content.galleryImages);
        setContentError('');
      })
      .catch((error: unknown) => {
        if (active) {
          setContentError(error instanceof Error ? error.message : 'Unable to load content from the local database.');
        }
      })
      .finally(() => {
        if (active) setContentLoading(false);
      });

    fetchAdminSession()
      .then((authenticated) => {
        if (active) setIsAdmin(authenticated);
      })
      .catch((error: unknown) => {
        if (active) {
          setContentError((previous) => previous || (error instanceof Error ? error.message : 'Unable to check admin session.'));
        }
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!posts.length) {
      setSelectedPost(null);
      return;
    }

    if (!selectedPost || !posts.some((post) => post.id === selectedPost.id)) {
      setSelectedPost(posts[0]);
    }
  }, [posts, selectedPost]);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [isAdInfoOpen, setIsAdInfoOpen] = useState(false);

  // Navigation handlers
  const handleSelectPost = (post: Post) => {
    setSelectedPost(post);
    setCurrentView('post');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (view: ViewMode) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = () => {
    setIsSearchOpen(true);
  };

  // Add Comment handler
  const handleAddComment = async (postId: string, newComment: Comment) => {
    const currentPost = posts.find((post) => post.id === postId);
    if (!currentPost) return;

    const updatedPost = { ...currentPost, comments: [...currentPost.comments, newComment] };
    try {
      await savePostComment(postId, newComment);
      setPosts((prevPosts) => prevPosts.map((post) => post.id === postId ? updatedPost : post));
      if (selectedPost?.id === postId) setSelectedPost(updatedPost);
    } catch (error) {
      setContentError(error instanceof Error ? error.message : 'Unable to save comment.');
    }
  };

  // Admin content management functions
  const handleAddPost = async (newPost: Post) => {
    await savePost(newPost);
    setPosts((prevPosts) => [newPost, ...prevPosts]);
    setSelectedPost(newPost);
  };

  const handleUpdatePost = async (updatedPost: Post) => {
    await savePost(updatedPost);
    setPosts((prevPosts) => prevPosts.map((post) => post.id === updatedPost.id ? updatedPost : post));
    if (selectedPost && selectedPost.id === updatedPost.id) {
      setSelectedPost(updatedPost);
    }
  };

  const handleDeletePost = async (postId: string) => {
    await removePost(postId);
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    if (selectedPost?.id === postId) {
      setSelectedPost(posts.find((post) => post.id !== postId) || null);
      setCurrentView('home');
    }
  };

  const handleAddVideo = async (newVideo: VideoItem) => {
    await saveVideo(newVideo);
    setVideos((prevVideos) => [newVideo, ...prevVideos]);
  };

  const handleUpdateVideo = async (updatedVideo: VideoItem) => {
    await saveVideo(updatedVideo);
    setVideos((prevVideos) => prevVideos.map((video) => video.id === updatedVideo.id ? updatedVideo : video));
  };

  const handleDeleteVideo = async (videoId: string) => {
    await removeVideo(videoId);
    setVideos((prevVideos) => prevVideos.filter((video) => video.id !== videoId));
  };

  const handleAddGalleryImage = async (image: GalleryImage) => {
    await saveGalleryImage(image);
    setGalleryImages((prevImages) => [image, ...prevImages]);
  };

  const handleDeleteGalleryImage = async (imageId: string) => {
    await removeGalleryImage(imageId);
    setGalleryImages((prevImages) => prevImages.filter((image) => image.id !== imageId));
  };

  const handleAdminSignIn = async (email: string, password: string) => {
    await loginAdmin(email, password);
    setIsAdmin(true);
    try {
      const legacyContent = readLegacyContent();
      if (!legacyContent) return;

      const migration = await importLegacyContent(legacyContent);
      if (!migration.imported) return;

      Object.values(LEGACY_STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key));
      const content = await fetchContent();
      setPosts(content.posts);
      setVideos(content.videos);
      setGalleryImages(content.galleryImages);
      setContentError('');
    } catch (error) {
      setContentError(error instanceof Error
        ? `Signed in, but browser-saved content could not be imported: ${error.message}`
        : 'Signed in, but browser-saved content could not be imported.');
    }
  };

  const handleAdminSignOut = async () => {
    await logoutAdmin();
    setIsAdmin(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-slate-800 font-sans">
      {/* 1. Top Social & Subscription Utility Bar */}
      <TopBar
        onOpenSubscribe={() => setIsSubscribeOpen(true)}
        onNavigateHome={() => handleNavigate('home')}
      />

      {/* 2. Site Header with Logo & Static Banner Advertisement */}
      <Header
        onNavigateHome={() => handleNavigate('home')}
        onAdClick={() => setIsAdInfoOpen(true)}
      />

      {/* 3. Primary navigation */}
      <NavBar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 4. Top Stories Scrolling Ticker */}
      <TopStoriesTicker
        posts={posts}
        onSelectPost={handleSelectPost}
      />

      {/* 5. Main Dynamic Body Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <>
            {/* The 4-Column Exact MagazineSpare Editorial Section */}
            <MainGrid
              posts={posts}
              onSelectPost={handleSelectPost}
            />

            {galleryImages.length > 0 && (
              <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-end justify-between border-b-2 border-slate-200 pb-2 mb-5">
                  <div>
                    <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 font-condensed">
                      Photo Gallery
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">Explore photos from our community.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNavigate('gallery')}
                    className="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700"
                  >
                    View all photos
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {galleryImages.slice(0, 6).map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => handleNavigate('gallery')}
                      aria-label={`Open photo gallery, preview ${index + 1}`}
                      className="group aspect-square overflow-hidden bg-slate-200"
                    >
                      <img
                        src={image.url}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {posts.length > 0 && (
              <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2 mb-5">
                  <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 font-condensed">Latest Stories</h2>
                  <button
                    onClick={() => handleNavigate('articles')}
                    className="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700"
                  >
                    All articles
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {posts.slice(0, 4).map((post) => (
                    <article
                      key={post.id}
                      onClick={() => handleSelectPost(post)}
                      className="group cursor-pointer border border-slate-200 bg-white p-3 shadow-xs"
                    >
                      <div className="mb-3 aspect-[16/10] overflow-hidden bg-slate-100">
                        <img
                          src={post.image}
                          alt={post.title}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <h3 className="line-clamp-2 font-bold leading-snug text-slate-900 group-hover:text-red-600">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-500">{post.date} · {post.author}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Mid Page Static Banner Ad */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <BannerAd type="mid" />
            </div>

            {/* Featured News 5-column grid */}
            <FeaturedNews
              posts={posts}
              onSelectPost={handleSelectPost}
            />

            {/* Bottom Page Static Banner Ad */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-8">
              <BannerAd type="bottom" />
            </div>
          </>
        )}

        {currentView === 'articles' && (
          <ArticlesPage
            posts={posts}
            onSelectPost={handleSelectPost}
            onSearch={handleSearch}
          />
        )}

        {/* Shop Page: NO ADS */}
        {currentView === 'shop' && (
          <ShopPage
            onNavigateHome={() => handleNavigate('home')}
          />
        )}

        {currentView === 'videos' && (
          <VideosPage
            videos={videos}
          />
        )}

        {currentView === 'gallery' && (
          <PhotoGalleryPage
            images={galleryImages}
          />
        )}

        {/* Admin Panel: NO ADS, UNIQUE STYLE & HIGHER FONT SIZE */}
        {currentView === 'admin' && (
          <AdminPanelPage
            posts={posts}
            videos={videos}
            galleryImages={galleryImages}
            requiresAdminAuth
            isAdmin={isAdmin}
            authLoading={authLoading}
            contentError={contentError}
            onSignIn={handleAdminSignIn}
            onSignOut={handleAdminSignOut}
            onAddPost={handleAddPost}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            onAddVideo={handleAddVideo}
            onUpdateVideo={handleUpdateVideo}
            onDeleteVideo={handleDeleteVideo}
            onAddGalleryImage={handleAddGalleryImage}
            onDeleteGalleryImage={handleDeleteGalleryImage}
          />
        )}

        {currentView === 'post' && selectedPost && (
          <div className="py-8">
            <PostDetail
              post={selectedPost}
              allPosts={posts}
              onSelectPost={handleSelectPost}
              onAddComment={handleAddComment}
              onNavigateHome={() => handleNavigate('home')}
            />
          </div>
        )}

        {currentView === 'author' && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BannerAd type="top" className="mb-6" />
            <PageTemplates
              template="author"
              posts={posts}
              onSelectPost={handleSelectPost}
              onSelectCategory={() => {}}
              onSearch={handleSearch}
              onOpenSubscribe={() => setIsSubscribeOpen(true)}
              onNavigateHome={() => handleNavigate('home')}
            />
            <BannerAd type="bottom" className="mt-8" />
          </div>
        )}

        {currentView === 'contact' && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BannerAd type="top" className="mb-6" />
            <PageTemplates
              template="contact"
              posts={posts}
              onSelectPost={handleSelectPost}
              onSelectCategory={() => {}}
              onSearch={handleSearch}
              onOpenSubscribe={() => setIsSubscribeOpen(true)}
              onNavigateHome={() => handleNavigate('home')}
            />
            <BannerAd type="bottom" className="mt-8" />
          </div>
        )}
      </main>

      {/* 6. MagazineSpare Editorial Footer */}
      <Footer
        posts={posts}
        onSelectPost={handleSelectPost}
        onSelectCategory={() => {}}
        onNavigate={handleNavigate}
        onOpenSubscribe={() => setIsSubscribeOpen(true)}
      />

      {/* 7. Interactive Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        posts={posts}
        onSelectPost={handleSelectPost}
      />

      <SubscribeModal
        isOpen={isSubscribeOpen}
        onClose={() => setIsSubscribeOpen(false)}
      />

      <AdInfoModal
        isOpen={isAdInfoOpen}
        onClose={() => setIsAdInfoOpen(false)}
      />
    </div>
  );
}
