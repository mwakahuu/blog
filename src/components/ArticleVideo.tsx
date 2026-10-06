import React from 'react';
import { HlsVideoPlayer } from './HlsVideoPlayer';

interface ArticleVideoProps {
  url: string;
  title: string;
}

const getEmbedUrl = (rawUrl: string): string | null => {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(hostname)) {
      const id = url.searchParams.get('v') || url.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (hostname === 'vimeo.com' || hostname === 'player.vimeo.com') {
      const id = url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
};

export const ArticleVideo: React.FC<ArticleVideoProps> = ({ url, title }) => {
  const embedUrl = getEmbedUrl(url);
  const isHls = (() => {
    try {
      return new URL(url).pathname.toLowerCase().endsWith('.m3u8');
    } catch {
      return false;
    }
  })();

  return (
    <div className="my-8 overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : isHls ? (
        <HlsVideoPlayer src={url} title={title} />
      ) : (
        <video
          src={url}
          className="h-full w-full object-contain"
          controls
          playsInline
          preload="metadata"
          aria-label={title}
        >
          Your browser does not support embedded video.
        </video>
      )}
    </div>
  );
};
