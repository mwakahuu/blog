import { VideoItem } from '../types';

const CDN_HLS_UUIDS = [
  '07c96ad4-5d59-4d6c-897e-fc0eab81ae20',
  '0ba6c32d-3bd8-48bb-a3cc-dc211cfc188d',
  '0f3e4ef1-baa9-48ac-97e4-af10dfd3bfd4',
  '132e319d-0bff-420b-883f-3e0ad278a0fd',
  '36c5cf04-a69f-4db3-b642-41ef8c96e734',
  '39afc047-d1c9-46aa-9b51-5fff107b60a6',
  '3d3f4785-d0e6-43b5-a3e4-4c06a8582dd4',
  '5737abc5-4dd7-47bc-873b-55c7d11725e7',
  '58a26e4d-fdcf-468a-aae8-269848392f18',
  '62b93efa-4e6d-4b4f-a74f-21279278aa13',
  '6664b478-ff89-4bb5-80e6-855838eab3b1',
  '6c5b6ca7-d758-4dd5-b641-5cc4a5b6a9a9',
  '713b29aa-f2d1-4165-baa7-9a86c6b0a6a2',
  '74e76a96-97f8-45bb-b17a-57deb16ff31c',
  '785ac583-1e5b-4b32-83ce-3fde81d39247',
  '7bb88edb-a0c1-40bc-b4b8-6b3b2d58058f',
  '7c6720fb-ec39-4464-b89f-b36be1155178',
  '7d55ab74-19e9-45cf-a7ee-d8f68f12a540',
  '7dfbabe1-b7c7-46d0-85f5-bd8e36665781',
  '7eeff872-8763-4fdd-8e46-029598d6cf8a',
  '8e363bef-0e6c-4165-a01d-29cc60a6e5f6',
  '916e513f-0e0f-4b91-986d-9086b4037c9d',
  '9186d611-c190-4c48-bb24-af43b398a9ae',
  '942643d4-db26-4411-8f6c-94000d0e0013',
  'b686705d-9760-4f49-8e19-9c62ef16f631',
  'b933e616-b42c-4e12-acda-5442f2c49018',
  'c3d68b29-3092-485d-ac7b-68e3ea479f9a',
  'ca685bac-520b-49ab-a9c8-e9aaf056a300',
  'cad5c346-f878-44fe-ab26-26e4a18a1850',
  'd6c6f35c-38e5-4d5f-a857-0d7596d6cbc4',
  'd7d18b27-e8b8-4f69-8cf9-aea9af8cf268',
  'd7fa151f-b708-40f2-af8f-714d73bc3f46',
  'd9aede15-4d47-4840-ba19-d3bdd9225e57',
  'e163e488-ea76-41c3-9eea-151bd279f700',
  'e28ed66d-a0d3-4f72-9312-8cc38fe8ad3a',
  'f179db45-13c0-4a6a-8776-8c616f00727c',
  'f73b8b6a-e0e3-4c43-a932-3a936f3b3878',
  'f7543df4-c5c5-4229-b767-be0d641f3452',
  'ff58a7e4-3c29-46f0-812c-77eedfdb2d96',
];

const CDN_VIDEO_URLS = CDN_HLS_UUIDS.map(
  (uuid) => `https://vz-6aac71b9-360.b-cdn.net/${uuid}/playlist.m3u8`
);

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

export const VIDEOS: VideoItem[] = CDN_VIDEO_URLS.map((url, index) => {
  const quality = url.includes('720p') ? '720p HD' : url.includes('480p') ? '480p' : '360p';
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
    videoUrl: url,
    channelName: 'MagazineSpare TV Broadcast',
    description: `Original web video stream in ${quality} resolution. Tap play to stream seamlessly via the Video.js web media player.`,
    likes: `${(1.2 + (index * 0.4)).toFixed(1)}K`,
  };
});
