import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import {
  createBunnyTokenUrl,
  getEntitlementWindow,
  normalizeTanzanianPhone,
  normalizeTzsAmount,
  publicVideo,
  resolveAllowedMediaUrl,
  rewriteHlsManifest,
} from '../src/premiumAccess';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('accepts only local Tanzanian mobile numbers beginning with 06 or 07', () => {
  assert.equal(normalizeTanzanianPhone('0712345678'), '255712345678');
  assert.equal(normalizeTanzanianPhone('0612345678'), '255612345678');
  assert.equal(normalizeTanzanianPhone('+255712345678'), null);
  assert.equal(normalizeTanzanianPhone('0812345678'), null);
  assert.equal(normalizeTanzanianPhone('071234567'), null);
});

test('normalizes FastLipa TZS amounts returned as either numbers or digit strings', () => {
  assert.equal(normalizeTzsAmount(3000), 3000);
  assert.equal(normalizeTzsAmount('3000'), 3000);
  assert.equal(normalizeTzsAmount(' 3000 '), 3000);
  assert.equal(normalizeTzsAmount('3000.00'), null);
  assert.equal(normalizeTzsAmount('invalid'), null);
  assert.equal(normalizeTzsAmount(Number.MAX_SAFE_INTEGER + 1), null);
});

test('starts first entitlement now and extends an active entitlement from its expiry', () => {
  const now = Date.UTC(2026, 9, 14, 12);
  const first = getEntitlementWindow(null, now);
  assert.equal(first.startsAt, now);
  assert.equal(first.expiresAt, now + 5 * 60 * 60 * 1000);

  const extended = getEntitlementWindow(first.expiresAt, now + 60_000);
  assert.equal(extended.startsAt, first.expiresAt);
  assert.equal(extended.expiresAt, first.expiresAt + 5 * 60 * 60 * 1000);

  const expired = getEntitlementWindow(now - 1, now);
  assert.equal(expired.startsAt, now);
});

test('signs Bunny CDN URLs by path and expiry without changing the source path', () => {
  const expiresAt = 1_800_000_000;
  const url = createBunnyTokenUrl(new URL('https://cdn.example/video/playlist.m3u8'), 'secret', expiresAt);
  assert.equal(url.pathname, '/video/playlist.m3u8');
  assert.equal(url.searchParams.get('expires'), String(expiresAt));
  assert.match(url.searchParams.get('token') ?? '', /^[A-Za-z0-9_-]+$/);
});

test('omits premium source URLs from public metadata but preserves free URLs', () => {
  const premium = publicVideo({ id: 'premium', isPremium: true, videoUrl: 'https://media.example/premium.m3u8' });
  const free = publicVideo({ id: 'free', isPremium: false, videoUrl: 'https://media.example/free.m3u8' });
  assert.equal('videoUrl' in premium, false);
  assert.equal(free.videoUrl, 'https://media.example/free.m3u8');
});

test('resolves media from any HTTPS source but confines requests to its HTTPS origin and directory', () => {
  const source = 'https://cdn.example/video-id/playlist.m3u8';
  const resolved = resolveAllowedMediaUrl(source, source, '720p/video.m3u8');
  assert.equal(resolved.href, 'https://cdn.example/video-id/720p/video.m3u8');
  assert.throws(() => resolveAllowedMediaUrl(source, source, '../../private.txt'));
  assert.throws(() => resolveAllowedMediaUrl(source, source, 'https://other.example/segment.ts'));
  assert.throws(() => resolveAllowedMediaUrl('http://cdn.example/a.m3u8', 'http://cdn.example/a.m3u8', 'a.ts'));
});

test('rewrites HLS child playlists and key URIs through the protected route', () => {
  const source = 'https://cdn.example/video-id/playlist.m3u8';
  const manifest = '#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n720p/video.m3u8\n';
  const rewritten = rewriteHlsManifest(manifest, source, source, 'vid-1');
  assert.match(rewritten, /\/api\/videos\/vid-1\/stream\?resource=/);
  assert.doesNotMatch(rewritten, /https:\/\/cdn\.example/);
  assert.equal((rewritten.match(/\/api\/videos\/vid-1\/stream/g) ?? []).length, 2);
  assert.throws(() => rewriteHlsManifest('#EXTM3U\nhttps://other.example/a.ts', source, source, 'vid-1'));
});

test('premium migration creates constrained payment, entitlement, and hashed-session tables', () => {
  const database = new Database(':memory:');
  database.pragma('foreign_keys = ON');
  database.exec(readFileSync(path.join(projectRoot, 'migrations', '001_premium_access.sql'), 'utf8'));
  const paymentColumns = database.prepare('pragma table_info(payments)').all() as Array<{ name: string }>;
  assert.ok(paymentColumns.some((column) => column.name === 'browser_session_id'));
  assert.ok(paymentColumns.some((column) => column.name === 'entitlement_id'));
  const foreignKeyErrors = database.pragma('foreign_key_check') as unknown[];
  assert.equal(foreignKeyErrors.length, 0);
  database.close();
});
