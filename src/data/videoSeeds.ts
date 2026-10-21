import { VIDEOS } from './videos';

const VIDEO_URLS = [
  'https://storage.server.antenkayume.com/storage/uploads/4/688044f1-2e0b-47ad-9a2d-cf9bf3dcfd9d.mp4',
  'https://storage.server.antenkayume.com/storage/uploads/4/d1ae6271-b123-450f-bb79-4700e89f5ff0.mp4',
  'https://storage.server.antenkayume.com/storage/uploads/4/f862a38e-b6f1-4291-b503-0b4aa36b6d45.mp4',
  'https://storage.server.antenkayume.com/storage/uploads/4/12197c8e-c392-404c-922c-7b9e91e4187d.mp4',
  'https://storage.server.antenkayume.com/storage/uploads/4/f0422b5d-48c1-42f6-be24-622d234f2b95.mp4',
  'https://storage.server.antenkayume.com/storage/uploads/4/61b003c7-625b-4541-86a1-25e7c58f0c99.mp4',
];

export const SEEDED_VIDEOS = VIDEOS.map((video, index) => ({
  ...video,
  videoUrl: VIDEO_URLS[index],
  isPremium: index < 2,
}));