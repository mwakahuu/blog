import React, { useState } from 'react';
import { VideoItem } from '../types';
import { VIDEOS } from '../data/videos';
import { BannerAd } from './BannerAds';
import { HlsVideoPlayer } from './HlsVideoPlayer';

interface VideosPageProps {
  videos?: VideoItem[];
}

export const VideosPage: React.FC<VideosPageProps> = ({ videos = VIDEOS }) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem>(videos[0] || VIDEOS[0]);

  const currentVideoSrc = selectedVideo.videoUrl || 'https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/highest.mp4';

  const handleSelectVideo = (video: VideoItem) => {
    setSelectedVideo(video);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      {/* Top Banner Ad (1 of 3) */}
      <BannerAd type="top" className="mb-6" />

      {/* Header */}
      <div className="bg-white p-6 sm:p-8 border border-slate-200 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-condensed">
            Web Video Player & Media Archive
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            High-performance web video player streaming in 1080p / 4K with adaptive bitrate and responsive HTML5 controls.
          </p>
        </div>

      </div>

      {/* Main Web Video.js Player Component */}
      <div className="max-w-4xl mx-auto bg-black text-white rounded-xs overflow-hidden shadow-2xl mb-8 border border-slate-800">
        <div className="w-full bg-black" style={{ aspectRatio: '16 / 9' }}>
          <HlsVideoPlayer
            key={selectedVideo.id}
            src={currentVideoSrc}
            title={selectedVideo.title}
            poster={selectedVideo.thumbnail}
          />
        </div>

        {/* Video Info Description */}
        <div className="p-6 bg-slate-950 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-condensed tracking-tight">
                {selectedVideo.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span>Duration: {selectedVideo.duration}</span>
                <span>•</span>
                <span>{selectedVideo.uploadDate}</span>
              </div>
            </div>

            <a
              href={`https://wa.me/255623709042?text=${encodeURIComponent('Tazama video hii: ' + selectedVideo.title)}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xs transition-colors self-start sm:self-auto"
            >
              Share via WhatsApp
            </a>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed max-w-4xl">
            {selectedVideo.description}
          </p>
        </div>
      </div>

      {/* Mid Banner Ad (2 of 3) */}
      <BannerAd type="mid" className="my-8" />

      {/* Video Playlist Grid */}
      <div className="mb-6 pb-2 border-b-2 border-slate-200 relative after:absolute after:bottom-[-2px] after:left-0 after:w-16 after:h-[2px] after:bg-red-600">
        <h3 className="text-xl font-bold uppercase tracking-wider text-slate-900 font-condensed">
          Select Video to Play ({videos.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((vid) => {
          const isSelected = vid.id === selectedVideo.id;
          return (
            <div
              key={vid.id}
              onClick={() => handleSelectVideo(vid)}
              className={`group cursor-pointer bg-white border overflow-hidden shadow-xs transition-all flex flex-col ${
                isSelected ? 'border-red-600 ring-2 ring-red-600/30' : 'border-slate-200 hover:border-slate-400'
              }`}
            >
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                <img
                  src={vid.thumbnail}
                  alt={vid.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2 right-2 bg-black/85 text-white text-[11px] font-mono px-2 py-0.5 rounded font-bold">
                  {vid.duration}
                </span>
                {isSelected && (
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                    Now Playing
                  </span>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2 leading-snug mb-2 font-condensed">
                  {vid.title}
                </h4>
                <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-2">
                  <span>{vid.duration}</span>
                  <span className="text-red-600 font-bold uppercase text-[10px]">
                    {isSelected ? 'Active' : 'Play Video →'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Banner Ad (3 of 3) */}
      <BannerAd type="bottom" className="mt-12" />
    </div>
  );
};
