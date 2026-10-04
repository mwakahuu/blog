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

const STORAGE_KEYS = {
  posts: 'blog_posts',
  videos: 'blog_videos',
  gallery: 'blog_gallery',
};

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    if (!storedValue) {
      return fallback;
    }
    return JSON.parse(storedValue) as T;
  } catch {
    return fallback;
  }
};

export default function App() {
  const [posts, setPosts] = useState<Post[]>(() => readStorage<Post[]>(STORAGE_KEYS.posts, POSTS));
  const [videos, setVideos] = useState<VideoItem[]>(() => readStorage<VideoItem[]>(STORAGE_KEYS.videos, VIDEOS));
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(() => readStorage<GalleryImage[]>(STORAGE_KEYS.gallery, INITIAL_GALLERY_IMAGES));
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.posts, JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.videos, JSON.stringify(videos));
  }, [videos]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.gallery, JSON.stringify(galleryImages));
  }, [galleryImages]);

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
  const handleAddComment = (postId: string, newComment: Comment) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const updated = {
            ...p,
            comments: [...p.comments, newComment],
          };
          if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(updated);
          }
          return updated;
        }
        return p;
      })
    );
  };

  // Admin content management functions
  const handleAddPost = (newPost: Post) => {
    setPosts((prevPosts) => [newPost, ...prevPosts]);
    setSelectedPost(newPost);
  };

  const handleUpdatePost = (updatedPost: Post) => {
    setPosts(posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    if (selectedPost && selectedPost.id === updatedPost.id) {
      setSelectedPost(updatedPost);
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prevPosts) => {
      const nextPosts = prevPosts.filter((p) => p.id !== postId);
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost(nextPosts[0] || null);
        setCurrentView('home');
      }
      return nextPosts;
    });
  };

  const handleAddVideo = (newVideo: VideoItem) => {
    setVideos([newVideo, ...videos]);
  };

  const handleUpdateVideo = (updatedVideo: VideoItem) => {
    setVideos(videos.map((v) => (v.id === updatedVideo.id ? updatedVideo : v)));
  };

  const handleDeleteVideo = (videoId: string) => {
    setVideos(videos.filter((v) => v.id !== videoId));
  };

  const handleAddGalleryImage = (image: GalleryImage) => {
    setGalleryImages([image, ...galleryImages]);
  };

  const handleDeleteGalleryImage = (imageId: string) => {
    setGalleryImages(galleryImages.filter((img) => img.id !== imageId));
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

      {/* 3. Primary Red Navigation Bar with Home, Articles, Shop, Videos, Gallery, Admin Panel, Docs, Support, Contact */}
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

        {currentView === 'docs' && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BannerAd type="top" className="mb-6" />
            <PageTemplates
              template="docs"
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

        {currentView === 'support' && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <BannerAd type="top" className="mb-6" />
            <PageTemplates
              template="support"
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
