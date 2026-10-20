import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeVideoUrl } from '../src/videoUrl';

test('accepts one complete Cloudinary, Bunny, or Mux video URL', () => {
  assert.equal(
    normalizeVideoUrl(' https://res.cloudinary.com/demo/video/upload/sample.mp4 '),
    'https://res.cloudinary.com/demo/video/upload/sample.mp4',
  );
  assert.equal(
    normalizeVideoUrl('https://vz-example-1.b-cdn.net/video/playlist.m3u8'),
    'https://vz-example-1.b-cdn.net/video/playlist.m3u8',
  );
  assert.equal(
    normalizeVideoUrl('https://stream.mux.com/example/highest.mp4'),
    'https://stream.mux.com/example/highest.mp4',
  );
});

test('rejects concatenated, incomplete, credentialed, and non-web video URLs', () => {
  assert.equal(
    normalizeVideoUrl('sthttps//vhttps://kayatan.cc/video.mp4z-6aac71b9.b-cdn.net/playlist.m3u8ream.mux.com/highest.mp4'),
    null,
  );
  assert.equal(normalizeVideoUrl('https://cdn.example/video.mp4https://other.example/clip.mp4'), null);
  assert.equal(normalizeVideoUrl('https://stream'), null);
  assert.equal(normalizeVideoUrl('https://user:password@cdn.example/video.mp4'), null);
  assert.equal(normalizeVideoUrl('javascript:alert(1)'), null);
  assert.equal(normalizeVideoUrl('https://cdn.example/video with spaces.mp4'), null);
  assert.equal(normalizeVideoUrl(undefined), null);
});
