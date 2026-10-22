import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface HlsVideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
  mediaType?: 'hls' | 'file';
}

export const HlsVideoPlayer: React.FC<HlsVideoPlayerProps> = ({ src, title, poster, mediaType }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const showMediaError = (video: HTMLVideoElement) => {
    const code = video.error?.code;
    setErrorMessage(code === 2
      ? 'Network error loading this video. Check that the storage host is reachable from the website.'
      : code === 3
        ? 'The video was downloaded but its encoding is not supported by this browser. Re-encode it as H.264 video with AAC audio in an MP4 container.'
        : code === 4
          ? 'This video URL or format is not supported. Use a direct MP4 file or an HLS playlist.'
          : 'This video could not be played. Confirm its public URL and media format.');
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setErrorMessage(null);

    if (!src) {
      setErrorMessage('No video source available.');
      return;
    }

    const isHls = mediaType ?? (() => {
      try {
        return new URL(src, window.location.href).pathname.toLowerCase().endsWith('.m3u8') ? 'hls' : 'file';
      } catch {
        return 'file';
      }
    })();

    if (isHls === 'file') {
      video.src = src;
      video.load();
      return () => {
        video.removeAttribute('src');
        video.load();
      };
    }

    const useNativeHls = video.canPlayType('application/vnd.apple.mpegurl');

    if (Hls.isSupported()) {
      const hls = new Hls({
        defaultAudioCodec: 'mp4a.40.2',
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        backBufferLength: 90,
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
        capLevelToPlayerSize: true,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setErrorMessage('This video could not be loaded. Please try another stream or refresh the page.');
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (useNativeHls) {
      video.src = src;
      video.load();
      return;
    }

    setErrorMessage('This browser does not support HLS playback. Please use a modern browser or try again.');
  }, [src, mediaType]);

  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        poster={poster}
        controls
        controlsList="nodownload"
        preload="metadata"
        playsInline
        onError={(event) => showMediaError(event.currentTarget)}
        aria-label={title}
      />

      {errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center text-sm text-white">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
