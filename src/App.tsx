/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { POSTS } from './data/posts';
import { VIDEOS } from './data/videos';
import { INITIAL_GALLERY_IMAGES } from './data/gallery';
import { PRODUCTS } from './data/shop';
import { Post, Comment, ViewMode, VideoItem, GalleryImage, ShopProduct } from './types';
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
  fetchAdminVideos,
  fetchAdminSession,
  fetchContent,
  importLegacyContent,
  loginAdmin,
  logoutAdmin,
  removeGalleryImage,
  removePost,
  removeProduct,
  removeVideo,
  saveGalleryImage,
  savePostComment,
  savePost,
  saveProduct,
  saveVideo,
  setFeaturedVideo as saveFeaturedVideo,
  type LegacyContent,
} from './contentStore';

const LEGACY_STORAGE_KEYS = {
  posts: 'blog_posts',
  videos: 'blog_videos',
  galleryImages: 'blog_gallery',
} as const;

const getViewFromPath = (): ViewMode => (
  /^\/admin\/?$/.test(window.location.pathname) ? 'admin' : 'home'
);

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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (
    window.localStorage.getItem('blog-theme') === 'dark' ? 'dark' : 'light'
  ));
  const [posts, setPosts] = useState<Post[]>(POSTS);
  const [videos, setVideos] = useState<VideoItem[]>(VIDEOS);
  const [adminVideos, setAdminVideos] = useState<VideoItem[]>([]);
  const [featuredVideoId, setFeaturedVideoId] = useState<string | null>(VIDEOS[0]?.id ?? null);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(INITIAL_GALLERY_IMAGES);
  const [products, setProducts] = useState<ShopProduct[]>(PRODUCTS);
  const [currentView, setCurrentView] = useState<ViewMode>(getViewFromPath);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [requestedVideoId, setRequestedVideoId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState('');

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('blog-theme', theme);
  }, [theme]);

  useEffect(() => {
    let active = true;

    fetchContent()
      .then((content) => {
        if (!active) return;
        setPosts(content.posts);
        setVideos(content.videos);
        setFeaturedVideoId(content.featuredVideoId);
        setGalleryImages(content.galleryImages);
        setProducts(content.products);
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
      .then(async (authenticated) => {
        if (!active) return;
        setIsAdmin(authenticated);
        if (authenticated) setAdminVideos(await fetchAdminVideos());
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
    const handlePopState = () => setCurrentView(getViewFromPath());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (currentView === 'videos' && requestedVideoId) setRequestedVideoId(null);
  }, [currentView, requestedVideoId]);

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

  const handlePlayVideo = (video: VideoItem) => {
    setRequestedVideoId(video.id);
    handleNavigate('videos');
  };

  const handleNavigate = (view: ViewMode) => {
    if (view === 'admin' && !/^\/admin\/?$/.test(window.location.pathname)) {
      window.history.pushState(null, '', '/admin');
    } else if (view !== 'admin' && /^\/admin\/?$/.test(window.location.pathname)) {
      window.history.pushState(null, '', '/');
    }
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
  const refreshVideoLists = async () => {
    const [content, adminVideoList] = await Promise.all([fetchContent(), fetchAdminVideos()]);
    setVideos(content.videos);
    setFeaturedVideoId(content.featuredVideoId);
    setAdminVideos(adminVideoList);
  };

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
    await refreshVideoLists();
  };

  const handleUpdateVideo = async (updatedVideo: VideoItem) => {
    await saveVideo(updatedVideo);
    await refreshVideoLists();
  };

  const handleDeleteVideo = async (videoId: string) => {
    await removeVideo(videoId);
    await refreshVideoLists();
  };

  const handleSetFeaturedVideo = async (videoId: string | null) => {
    const result = await saveFeaturedVideo(videoId);
    setFeaturedVideoId(result.featuredVideoId);
  };

  const handleAddGalleryImage = async (image: GalleryImage) => {
    await saveGalleryImage(image);
    setGalleryImages((prevImages) => [image, ...prevImages]);
  };

  const handleDeleteGalleryImage = async (imageId: string) => {
    await removeGalleryImage(imageId);
    setGalleryImages((prevImages) => prevImages.filter((image) => image.id !== imageId));
  };

  const handleAddProduct = async (product: ShopProduct) => {
    await saveProduct(product);
    setProducts((previousProducts) => [product, ...previousProducts]);
  };

  const handleUpdateProduct = async (updatedProduct: ShopProduct) => {
    await saveProduct(updatedProduct);
    setProducts((previousProducts) => previousProducts.map((product) =>
      product.id === updatedProduct.id ? updatedProduct : product));
  };

  const handleDeleteProduct = async (productId: string) => {
    await removeProduct(productId);
    setProducts((previousProducts) => previousProducts.filter((product) => product.id !== productId));
  };

  const handleAdminSignIn = async (email: string, password: string) => {
    await loginAdmin(email, password);
    setIsAdmin(true);
    setAdminVideos(await fetchAdminVideos());
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
    setAdminVideos([]);
  };

  return (
    <div className="app-shell min-h-screen flex flex-col font-sans" data-theme={theme}>
      <div className="theme-switch-bar">
        <div className="max-w-[1400px] mx-auto flex w-full justify-end px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="theme-switch"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            onClick={() => setTheme((currentTheme) => currentTheme === 'dark' ? 'light' : 'dark')}
          >
            <span className="theme-switch-track" aria-hidden="true">
              <span className="theme-switch-thumb" />
            </span>
            <span>{theme === 'dark' ? 'Dark' : 'Light'} mode</span>
          </button>
        </div>
      </div>

      {currentView !== 'admin' && (
        <>
          <TopBar
            onOpenSubscribe={() => setIsSubscribeOpen(true)}
            onNavigateHome={() => handleNavigate('home')}
          />
          <Header
            onNavigateHome={() => handleNavigate('home')}
            onAdClick={() => setIsAdInfoOpen(true)}
          />
          <NavBar
            currentView={currentView}
            onNavigate={handleNavigate}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
          <TopStoriesTicker
            posts={posts}
            onSelectPost={handleSelectPost}
          />
        </>
      )}

      {/* 5. Main Dynamic Body Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <>
            {/* The 4-Column Exact MagazineSpare Editorial Section */}
            <MainGrid
              posts={posts}
              onSelectPost={handleSelectPost}
              featuredVideo={videos.find((video) => video.id === featuredVideoId) ?? videos[0]}
              onSelectVideo={handlePlayVideo}
            />

            {products[0] && <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2 mb-5">
                <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 font-condensed">
                  Bidhaa Zetu
                </h2>
                <button
                  type="button"
                  onClick={() => handleNavigate('shop')}
                  className="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700"
                >
                  Tazama bidhaa zote
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate('shop')}
                aria-label={`Tazama bidhaa zote dukani. Bidhaa inayoangaziwa: ${products[0].title}`}
                className="group w-full overflow-hidden border border-slate-200 bg-white text-left shadow-xs transition-colors hover:border-slate-300 sm:flex"
              >
                <img
                  src={products[0].image}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="aspect-[16/10] w-full object-cover sm:aspect-auto sm:h-56 sm:w-2/5"
                />
                <span className="flex flex-1 flex-col justify-center p-5 sm:p-8">
                  <span className="text-lg font-bold text-slate-900 transition-colors group-hover:text-red-600 sm:text-2xl">
                    {products[0].title}
                  </span>
                  <span className="mt-2 line-clamp-2 text-sm font-medium leading-relaxed text-slate-600 sm:text-base">
                    {products[0].description}
                  </span>
                  <span className="mt-4 text-lg font-extrabold text-emerald-700">
                    {products[0].priceLabel}
                  </span>
                  <span className="mt-4 self-start bg-emerald-600 px-5 py-3 text-xs font-extrabold uppercase tracking-wider text-white transition-colors group-hover:bg-emerald-700">
                    Tembelea duka · Bidhaa zote
                  </span>
                </span>
              </button>
            </section>}

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
            products={products}
            posts={posts}
            onSelectPost={handleSelectPost}
            onSearch={handleSearch}
          />
        )}

        {currentView === 'videos' && (
          <VideosPage
            videos={videos}
            initialVideoId={requestedVideoId ?? undefined}
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
            videos={adminVideos}
            featuredVideoId={featuredVideoId}
            galleryImages={galleryImages}
            products={products}
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
            onSetFeaturedVideo={handleSetFeaturedVideo}
            onAddGalleryImage={handleAddGalleryImage}
            onDeleteGalleryImage={handleDeleteGalleryImage}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
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

      {currentView !== 'admin' && (
        <>
          <Footer
            posts={posts}
            onSelectPost={handleSelectPost}
            onSelectCategory={() => {}}
            onNavigate={handleNavigate}
            onOpenSubscribe={() => setIsSubscribeOpen(true)}
          />
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
        </>
      )}
    </div>
  );
}
