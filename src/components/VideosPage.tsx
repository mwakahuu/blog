import React, { useState } from 'react';
import type { Post, VideoItem } from '../types';
import { VIDEOS } from '../data/videos';
import { HlsVideoPlayer } from './HlsVideoPlayer';
import { Sidebar } from './Sidebar';

interface VideosPageProps {
  videos?: VideoItem[];
  posts: Post[];
  onSelectPost: (post: Post) => void;
  onSearch: (query: string) => void;
}

export const VideosPage: React.FC<VideosPageProps> = ({
  videos = VIDEOS,
  posts,
  onSelectPost,
  onSearch,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem>(videos[0] || VIDEOS[0]);

  const currentVideoSrc = selectedVideo.videoUrl || 'https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/highest.mp4';

  const handleSelectVideo = (video: VideoItem) => {
    setSelectedVideo(video);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  return (
    <div className="catalog-page max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8">
          <div className="catalog-panel mb-5">
            <h1 className="catalog-panel-heading">Video za Chombezo</h1>
          </div>

          <div className="catalog-video-player">
            <div className="w-full bg-black aspect-video">
              <HlsVideoPlayer
                key={selectedVideo.id}
                src={currentVideoSrc}
                title={selectedVideo.title}
                poster={selectedVideo.thumbnail}
              />
            </div>
            <div className="catalog-video-info">
              <h2>{selectedVideo.title}</h2>
              <div className="catalog-video-meta">
                <span>{selectedVideo.duration}</span>
                <span>{selectedVideo.uploadDate}</span>
              </div>
              <p>{selectedVideo.description}</p>
              <a
                href={`https://wa.me/255623709042?text=${encodeURIComponent('Tazama video hii: ' + selectedVideo.title)}`}
                target="_blank"
                rel="noreferrer"
                className="catalog-share-link"
              >
                Share via WhatsApp
              </a>
            </div>
          </div>

          <div className="catalog-panel mt-5">
            <h2 className="catalog-panel-heading">Latest Videos</h2>
            <div className="catalog-video-grid p-4">
              {videos.map((video) => {
                const isSelected = video.id === selectedVideo.id;
                return (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => handleSelectVideo(video)}
                    className={`catalog-video-card group ${isSelected ? 'catalog-video-card-selected' : ''}`}
                  >
                    <span className="catalog-video-thumbnail">
                      <img
                        src={video.thumbnail}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute bottom-2 right-2 bg-black/85 text-white text-[10px] px-1.5 py-1">
                        {video.duration}
                      </span>
                    </span>
                    <span className="catalog-video-card-content">
                      <span className="catalog-video-card-title">{video.title}</span>
                      <span className="catalog-video-card-meta">{video.uploadDate}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="lg:col-span-4">
          <Sidebar
            posts={posts}
            onSelectPost={onSelectPost}
            onSearch={onSearch}
            compact
          />
        </div>
      </div>
    </div>
  );
};
