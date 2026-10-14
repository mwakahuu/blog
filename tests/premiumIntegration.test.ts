import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createHash, createHmac } from 'node:crypto';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

type VideoRow = { id: string; data: string };

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const getAvailablePort = async () => new Promise<number>((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const address = server.address();
    if (!address || typeof address === 'string') {
      server.close();
      reject(new Error('Could not allocate a local test port.'));
      return;
    }
    const { port } = address;
    server.close((error) => error ? reject(error) : resolve(port));
  });
});

const waitForServer = async (child: ChildProcess, url: string) => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Test server exited with ${child.exitCode}.`);
    try {
      const response = await fetch(`${url}/api/content`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error('Test server did not start in time.');
};

test('FastLipa purchases grant five-hour access and authorize every premium stream', async (t) => {
  const tempDirectory = mkdtempSync(path.join(os.tmpdir(), 'blog-premium-integration-'));
  const databasePath = path.join(tempDirectory, 'blog.sqlite');
  const port = await getAvailablePort();
  const origin = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['--import', 'tsx', '--import', './tests/mockPaymentProvider.ts', 'server.ts'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(port),
      HOST: '127.0.0.1',
      DB_PATH: databasePath,
      ADMIN_EMAIL: 'admin@test.example',
      ADMIN_PASSWORD: 'test-only-admin-password-long-enough',
      FASTLIPA_API_TOKEN: 'test-provider-token',
      FASTLIPA_WEBHOOK_SECRET: 'test-webhook-secret',
      PUBLIC_APP_URL: origin,
      BUNNY_CDN_TOKEN_KEY: 'test-bunny-token-key',
      PREMIUM_VIDEO_ALLOWED_HOSTS: 'cdn.test',
      PREMIUM_MEDIA_PROTECTION_CONFIRMED: 'true',
    },
    stdio: 'ignore',
  });

  t.after(async () => {
    if (child.exitCode === null) {
      const exit = once(child, 'exit');
      child.kill('SIGTERM');
      await Promise.race([exit, new Promise((resolve) => setTimeout(resolve, 3000))]);
    }
    rmSync(tempDirectory, { recursive: true, force: true });
  });

  await waitForServer(child, origin);
  const database = new Database(databasePath);
  const rows = database.prepare('select id, data from videos order by id').all() as VideoRow[];
  const premiumVideos = rows.slice(0, 2).map((row, index) => {
    const video = JSON.parse(row.data) as Record<string, unknown>;
    video.isPremium = true;
    video.videoUrl = `https://cdn.test/video-${index + 1}/playlist.m3u8`;
    database.prepare('update videos set data = ? where id = ?').run(JSON.stringify(video), row.id);
    return row.id;
  });
  const freeVideoId = rows[2].id;
  database.close();

  let premiumCookie = '';
  const request = async (pathname: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (premiumCookie) headers.set('Cookie', premiumCookie);
    const response = await fetch(`${origin}${pathname}`, { ...init, headers });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie?.startsWith('blog_premium_session=')) premiumCookie = setCookie.split(';')[0];
    return response;
  };

  const contentResponse = await request('/api/content');
  const content = await contentResponse.json() as { videos: Array<Record<string, unknown>> };
  for (const id of premiumVideos) {
    const publicVideo = content.videos.find((video) => video.id === id);
    assert.equal(publicVideo?.isPremium, true);
    assert.equal(Object.hasOwn(publicVideo ?? {}, 'videoUrl'), false);
    assert.equal((await request(`/api/videos/${id}/playback`)).status, 403);
    assert.equal((await request(`/api/videos/${id}/stream?resource=%2Fvideo-1%2Fplaylist.m3u8`)).status, 403);
  }
  assert.equal((await fetch(`${origin}/api/videos/${premiumVideos[0]}/playback`, {
    headers: { Cookie: 'blog_premium_session=invalid-token' },
  })).status, 403);
  assert.equal((await request(`/api/videos/${freeVideoId}/playback`)).status, 200);
  assert.equal((await request('/api/admin/videos')).status, 401);
  assert.equal((await request('/api/payments/create', {
    method: 'POST',
    headers: { Origin: 'https://attacker.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '0712345678' }),
  })).status, 403);

  const invalidPhone = await request('/api/payments/create', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+255712345678', amount: 1 }),
  });
  assert.equal(invalidPhone.status, 400);

  const pendingResponse = await request('/api/payments/create', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '0612345678', amount: 1 }),
  });
  assert.equal(pendingResponse.status, 202);
  const pending = await pendingResponse.json() as { reference: string; amount: number };
  assert.equal(pending.amount, 3000);
  const pendingStatus = await request(`/api/payments/status/${encodeURIComponent(pending.reference)}`);
  assert.equal((await pendingStatus.json() as { status: string }).status, 'pending');
  assert.equal((await (await request('/api/access/status')).json() as { active: boolean }).active, false);
  assert.equal((await request(`/api/videos/${premiumVideos[0]}/playback`)).status, 403);

  const cancelledResponse = await request('/api/payments/create', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '0622345678' }),
  });
  const cancelled = await cancelledResponse.json() as { reference: string };
  const cancelledStatus = await request(`/api/payments/status/${encodeURIComponent(cancelled.reference)}`);
  assert.equal((await cancelledStatus.json() as { status: string }).status, 'cancelled');
  assert.equal((await (await request('/api/access/status')).json() as { active: boolean }).active, false);

  const paidResponse = await request('/api/payments/create', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '0712345678' }),
  });
  assert.equal(paidResponse.status, 202);
  const paid = await paidResponse.json() as { reference: string };
  const paidStatusResponse = await request(`/api/payments/status/${encodeURIComponent(paid.reference)}`);
  const paidStatus = await paidStatusResponse.json() as { status: string; accessActive: boolean; expiresAt: string };
  assert.equal(paidStatus.status, 'completed');
  assert.equal(paidStatus.accessActive, true);
  assert.ok(Date.parse(paidStatus.expiresAt) - Date.now() <= 5 * 60 * 60 * 1000);
  assert.ok(Date.parse(paidStatus.expiresAt) - Date.now() > 4 * 60 * 60 * 1000);
  assert.equal((await (await request('/api/access/status')).json() as { active: boolean }).active, true);

  const premiumPlayback = await request(`/api/videos/${premiumVideos[0]}/playback`);
  const playback = await premiumPlayback.json() as { url: string; format: string };
  assert.equal(premiumPlayback.status, 200);
  assert.equal(playback.format, 'hls');
  assert.ok(playback.url.startsWith('/api/videos/'));
  assert.doesNotMatch(playback.url, /cdn\.test/);
  assert.equal((await request(`/api/videos/${premiumVideos[1]}/playback`)).status, 200);

  const playlistResponse = await request(`/api/videos/${premiumVideos[0]}/stream?resource=%2Fvideo-1%2Fplaylist.m3u8`);
  const playlist = await playlistResponse.text();
  assert.equal(playlistResponse.status, 200);
  assert.doesNotMatch(playlist, /cdn\.test/);
  const childPlaylistPath = playlist.split('\n').find((line) => line.startsWith('/api/videos/'));
  assert.ok(childPlaylistPath);
  const childPlaylistResponse = await request(childPlaylistPath);
  const childPlaylist = await childPlaylistResponse.text();
  const segmentPath = childPlaylist.split('\n').find((line) => line.startsWith('/api/videos/'));
  assert.ok(segmentPath);
  const segmentResponse = await request(segmentPath, { headers: { Range: 'bytes=0-1' } });
  assert.equal(segmentResponse.status, 206);
  assert.equal(segmentResponse.headers.get('content-range'), 'bytes 0-1/4');

  const databaseForAssertions = new Database(databasePath);
  const paymentRow = databaseForAssertions.prepare('select id, provider_transaction_id from payments where reference = ?')
    .get(paid.reference) as { id: string; provider_transaction_id: string };
  const entitlementCount = (databaseForAssertions.prepare('select count(*) as count from entitlements').get() as { count: number }).count;
  const webhookBody = JSON.stringify({
    event: 'payment.completed',
    timestamp: new Date().toISOString(),
    data: { tranid: paymentRow.provider_transaction_id, reference: paid.reference, payment_status: 'COMPLETED', amount: 3000 },
  });
  const invalidWebhook = await request('/api/payments/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: webhookBody,
  });
  assert.equal(invalidWebhook.status, 401);
  const signature = `sha256=${createHmac('sha256', 'test-webhook-secret').update(webhookBody).digest('hex')}`;
  const repeatedWebhook = await request('/api/payments/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-FastLipa-Signature': signature },
    body: webhookBody,
  });
  assert.equal(repeatedWebhook.status, 200);
  assert.equal((databaseForAssertions.prepare('select count(*) as count from entitlements').get() as { count: number }).count, entitlementCount);
  assert.equal((await request(`/api/payments/status/${encodeURIComponent(paid.reference)}`)).status, 200);
  assert.equal((await request(`/api/payments/status/not-this-browser`)).status, 404);

  const mismatchedWebhookBody = JSON.stringify({
    event: 'payment.completed',
    data: { tranid: paymentRow.provider_transaction_id, reference: paid.reference, amount: 2900 },
  });
  const mismatchedSignature = `sha256=${createHmac('sha256', 'test-webhook-secret').update(mismatchedWebhookBody).digest('hex')}`;
  const mismatchedWebhook = await request('/api/payments/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-FastLipa-Signature': mismatchedSignature },
    body: mismatchedWebhookBody,
  });
  assert.equal(mismatchedWebhook.status, 404);

  const extensionResponse = await request('/api/payments/create', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '0712345678' }),
  });
  const extension = await extensionResponse.json() as { reference: string };
  const extensionPayment = databaseForAssertions.prepare('select id, provider_transaction_id from payments where reference = ?')
    .get(extension.reference) as { id: string; provider_transaction_id: string };
  const extensionWebhookBody = JSON.stringify({
    event: 'payment.completed',
    data: { tranid: extensionPayment.provider_transaction_id, reference: extension.reference, amount: 3000 },
  });
  const extensionSignature = `sha256=${createHmac('sha256', 'test-webhook-secret').update(extensionWebhookBody).digest('hex')}`;
  const duplicateCallbacks = await Promise.all([1, 2].map(() => request('/api/payments/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-FastLipa-Signature': extensionSignature },
    body: extensionWebhookBody,
  })));
  assert.ok(duplicateCallbacks.every((response) => response.status === 200));
  assert.equal((databaseForAssertions.prepare('select count(*) as count from entitlements').get() as { count: number }).count, entitlementCount);
  const entitlement = databaseForAssertions.prepare('select id, expires_at from entitlements where payment_id = ?')
    .get(paymentRow.id) as { id: string; expires_at: number };
  assert.ok(entitlement.expires_at > Date.parse(paidStatus.expiresAt));

  const adminLogin = await fetch(`${origin}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@test.example', password: 'test-only-admin-password-long-enough' }),
  });
  assert.equal(adminLogin.status, 200);
  const adminCookie = adminLogin.headers.get('set-cookie')?.split(';')[0];
  assert.ok(adminCookie);
  const adminVideos = await fetch(`${origin}/api/admin/videos`, { headers: { Cookie: adminCookie } });
  const adminVideoList = await adminVideos.json() as Array<{ id: string; videoUrl?: string; isPremium?: boolean }>;
  assert.equal(adminVideoList.find((video) => video.id === premiumVideos[0])?.isPremium, true);
  assert.match(adminVideoList.find((video) => video.id === premiumVideos[0])?.videoUrl ?? '', /^https:\/\/cdn\.test\//);

  databaseForAssertions.prepare('update entitlements set expires_at = ? where id = ?').run(Date.now() - 1, entitlement.id);
  assert.equal((await (await request('/api/access/status')).json() as { active: boolean }).active, false);
  assert.equal((await request(`/api/videos/${premiumVideos[0]}/playback`)).status, 403);
  assert.equal((await request(`/api/videos/${premiumVideos[0]}/stream?resource=%2Fvideo-1%2Fplaylist.m3u8`)).status, 403);
  databaseForAssertions.prepare('update entitlements set expires_at = ? where id = ?').run(Date.now() + 60_000, entitlement.id);
  const rawPremiumToken = premiumCookie.slice('blog_premium_session='.length);
  databaseForAssertions.prepare('update premium_sessions set revoked_at = ? where token_hash = ?')
    .run(Date.now(), createHash('sha256').update(decodeURIComponent(rawPremiumToken)).digest('hex'));
  assert.equal((await (await request('/api/access/status')).json() as { active: boolean }).active, false);
  assert.equal((await request(`/api/videos/${premiumVideos[0]}/playback`)).status, 403);
  assert.equal((await request(`/api/videos/${freeVideoId}/playback`)).status, 200);
  databaseForAssertions.close();
});
