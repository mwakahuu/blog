import type { VideoItem } from '../types';

const POSTER_IMAGES = [
  'https://i.ibb.co/67wYdHvs/20260403-135715.webp',
  'https://i.ibb.co/67wYdHvs/20260403-135715.webp',
  'https://i.ibb.co/67wYdHvs/20260403-135715.webp',
  'https://i.ibb.co/67wYdHvs/20260403-135715.webp',
  'https://i.ibb.co/67wYdHvs/20260403-135715.webp',
  'https://i.ibb.co/67wYdHvs/20260403-135715.webp',
  'https://i.ibb.co/67wYdHvs/20260403-135715.webp',
  'https://i.ibb.co/67wYdHvs/20260403-135715.webp',
  'https://i.ibb.co/67wYdHvs/20260403-135715.webp',
  'https://i.ibb.co/67wYdHvs/20260403-135715.webp',
];

const RESOLUTION_TAGS = ['720p HD', '480p', '360p', '360p', '480p', '720p HD'];

export const VIDEOS: VideoItem[] = Array.from({ length: 6 }, (_, index) => {
  const quality = RESOLUTION_TAGS[index % RESOLUTION_TAGS.length];
  const minutes = Math.floor(3 + ((index * 7) % 18));
  const seconds = String((index * 13) % 60).padStart(2, '0');
  const duration = `${minutes}:${seconds}`;

  return {
    id: `cdn-video-${index + 1}`,
    title: `Video Report #${index + 1} - High Definition Broadcast (${quality})`,
    duration: duration,
    views: `${(15 + (index * 12) % 350)}K views`,
    uploadDate: `${((index % 6) + 1)} days ago`,
    thumbnail: POSTER_IMAGES[index % POSTER_IMAGES.length],
    channelName: 'Chombezo Videos',
    description: `Original web video stream in ${quality} resolution. Tap play to stream seamlessly via the Video.js web media player.`,
    likes: `${(1.2 + (index * 0.4)).toFixed(1)}K`,
  };
});
