import 'dotenv/config';

import Database from 'better-sqlite3';
import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { createServer as createHttpServer } from 'node:http';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_GALLERY_IMAGES } from './src/data/gallery';
import { PRODUCTS } from './src/data/shop';
import { SEEDED_VIDEOS } from './src/data/videoSeeds';
import { normalizeVideoUrl } from './src/videoUrl';
import {
  getEntitlementWindow,
  PREMIUM_ACCESS_DURATION_MS,
  PREMIUM_FLOW_SESSION_MS,
  PREMIUM_PRICE_TZS,
  PREMIUM_PRODUCT_ID,
  PREMIUM_SESSION_COOKIE,
  publicVideo,
  normalizeTanzanianPhone,
  normalizeTzsAmount,
  resolveAllowedMediaUrl,
  rewriteHlsManifest,
} from './src/premiumAccess';
import type { Comment, GalleryImage, Post, ShopProduct, VideoItem } from './src/types';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const databasePath = path.resolve(process.env.DB_PATH || path.join(projectRoot, 'data', 'blog.sqlite'));
mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.pragma('foreign_keys = ON');
database.exec(`
  create table if not exists posts (
    id text primary key,
    slug text not null unique,
    data text not null,
    created_at integer not null default (unixepoch())
  );
  create table if not exists videos (
    id text primary key,
    data text not null,
    created_at integer not null default (unixepoch())
  );
  create table if not exists gallery_images (
    id text primary key,
    data text not null,
    created_at integer not null default (unixepoch())
  );
  create table if not exists products (
    id text primary key,
    data text not null,
    created_at integer not null default (unixepoch())
  );
  create table if not exists post_comments (
    id text primary key,
    post_id text not null references posts(id) on delete cascade,
    data text not null,
    created_at integer not null default (unixepoch())
  );
  create table if not exists app_settings (
    key text primary key,
    value text not null
  );
`);
database.exec('create table if not exists schema_migrations (version integer primary key, applied_at integer not null)');
const premiumMigration = database.prepare('select version from schema_migrations where version = ?').get(1);
if (!premiumMigration) {
  database.transaction(() => {
    database.exec(readFileSync(path.join(projectRoot, 'migrations', '001_premium_access.sql'), 'utf-8'));
    database.prepare('insert into schema_migrations (version, applied_at) values (?, ?)').run(1, Date.now());
  })();
}
const dismissedPaymentsMigration = database.prepare('select version from schema_migrations where version = ?').get(2);
if (!dismissedPaymentsMigration) {
  database.transaction(() => {
    database.exec(readFileSync(path.join(projectRoot, 'migrations', '002_dismissed_payments.sql'), 'utf-8'));
    database.prepare('insert into schema_migrations (version, applied_at) values (?, ?)').run(2, Date.now());
  })();
}
database.prepare('update posts set created_at = created_at * 1000 where created_at < 100000000000').run();

const insertVideo = database.prepare('insert into videos (id, data) values (?, ?)');
const insertGalleryImage = database.prepare('insert into gallery_images (id, data) values (?, ?)');
const seedDefaults = database.transaction(() => {
  const initialized = database.prepare('select value from app_settings where key = ?').get('default_content_seeded');
  if (initialized) return;

  const videoCount = (database.prepare('select count(*) as count from videos').get() as { count: number }).count;
  const galleryCount = (database.prepare('select count(*) as count from gallery_images').get() as { count: number }).count;
  if (videoCount === 0) {
    for (const video of SEEDED_VIDEOS) insertVideo.run(video.id, JSON.stringify(video));
  }
  if (galleryCount === 0) {
    for (const image of INITIAL_GALLERY_IMAGES) insertGalleryImage.run(image.id, JSON.stringify(image));
  }
  database.prepare('insert into app_settings (key, value) values (?, ?)').run('default_content_seeded', 'true');
});
seedDefaults();

const updateVideoChannelBrand = database.transaction(() => {
  const migrationKey = 'video_channel_brand_updated';
  if (database.prepare('select value from app_settings where key = ?').get(migrationKey)) return;

  const existingVideos = database.prepare('select id, data from videos').all() as Array<{ id: string; data: string }>;
  const updateVideo = database.prepare('update videos set data = ? where id = ?');
  for (const existing of existingVideos) {
    const video = JSON.parse(existing.data) as VideoItem;
    if (video.channelName === 'MagazineSpare TV Broadcast') {
      updateVideo.run(JSON.stringify({ ...video, channelName: 'Chombezo Videos' }), existing.id);
    }
  }
  database.prepare('insert into app_settings (key, value) values (?, ?)').run(migrationKey, 'true');
});
updateVideoChannelBrand();

const replaceVideoCatalog = database.transaction(() => {
  const migrationKey = 'storage_video_catalog_replaced';
  if (database.prepare('select value from app_settings where key = ?').get(migrationKey)) return;

  const existingVideos = database.prepare('select id, data from videos order by rowid asc')
    .all() as Array<{ id: string; data: string }>;
  const updateVideo = database.prepare('update videos set data = ? where id = ?');
  const deleteVideo = database.prepare('delete from videos where id = ?');

  for (const [index, video] of SEEDED_VIDEOS.entries()) {
    const existing = existingVideos[index];
    if (existing) {
      const existingVideo = JSON.parse(existing.data) as VideoItem;
      updateVideo.run(JSON.stringify({
        ...existingVideo,
        videoUrl: video.videoUrl,
        isPremium: video.isPremium,
      }), existing.id);
    } else {
      insertVideo.run(video.id, JSON.stringify(video));
    }
  }
  for (const existing of existingVideos.slice(SEEDED_VIDEOS.length)) {
    deleteVideo.run(existing.id);
  }
  database.prepare('insert into app_settings (key, value) values (?, ?)').run(migrationKey, 'true');
});
replaceVideoCatalog();

const seedDefaultProducts = database.transaction(() => {
  const initialized = database.prepare('select value from app_settings where key = ?').get('default_products_seeded');
  if (initialized) return;

  const productCount = (database.prepare('select count(*) as count from products').get() as { count: number }).count;
  if (productCount === 0) {
    const insertProduct = database.prepare('insert into products (id, data) values (?, ?)');
    for (const product of PRODUCTS) insertProduct.run(product.id, JSON.stringify(product));
  }
  database.prepare('insert into app_settings (key, value) values (?, ?)').run('default_products_seeded', 'true');
});
seedDefaultProducts();

const app = express();
const httpServer = createHttpServer(app);
const sessions = new Map<string, number>();
const sessionCookie = 'blog_admin_session';
const sessionLifetimeMs = 12 * 60 * 60 * 1000;
const secureCookie = process.env.NODE_ENV === 'production';
if (
  secureCookie &&
  (!process.env.ADMIN_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL.trim().toLowerCase() === 'admin@example.com' ||
    !process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD === 'replace-with-a-long-random-password' ||
    process.env.ADMIN_PASSWORD.length < 24)
) {
  throw new Error('Production requires a real ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 24 characters.');
}

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((_request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use('/api', express.json({ limit: '1mb' }));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const hasStringFields = (value: unknown, fields: string[]): value is Record<string, unknown> =>
  isRecord(value) && fields.every((field) => typeof value[field] === 'string');

const readCookie = (request: Request, name: string): string | undefined => {
  const entry = request.headers.cookie?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return entry ? entry.slice(name.length + 1) : undefined;
};

const requireAdmin: RequestHandler = (request, response, next) => {
  const token = readCookie(request, sessionCookie);
  const expiresAt = token ? sessions.get(token) : undefined;
  if (!token || !expiresAt || expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    response.status(401).json({ error: 'Please sign in to manage content.' });
    return;
  }
  next();
};

const constantTimeEqual = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

app.get('/api/auth/session', (request, response) => {
  const token = readCookie(request, sessionCookie);
  const expiresAt = token ? sessions.get(token) : undefined;
  if (!token || !expiresAt || expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    response.json({ authenticated: false });
    return;
  }
  response.json({ authenticated: true });
});

app.post('/api/auth/login', (request, response) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    response.status(503).json({ error: 'Admin access is not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD on the server.' });
    return;
  }

  const { email, password } = isRecord(request.body) ? request.body : {};
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    !constantTimeEqual(email.trim().toLowerCase(), adminEmail.trim().toLowerCase()) ||
    !constantTimeEqual(password, adminPassword)
  ) {
    response.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + sessionLifetimeMs;
  sessions.set(token, expiresAt);
  response.setHeader(
    'Set-Cookie',
    `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionLifetimeMs / 1000}${secureCookie ? '; Secure' : ''}`,
  );
  response.json({ authenticated: true });
});

app.post('/api/auth/logout', (request, response) => {
  const token = readCookie(request, sessionCookie);
  if (token) sessions.delete(token);
  response.setHeader('Set-Cookie', `${sessionCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookie ? '; Secure' : ''}`);
  response.json({ authenticated: false });
});

const queryData = <T,>(sql: string): T[] =>
  (database.prepare(sql).all() as Array<{ data: string }>).map((row) => JSON.parse(row.data) as T);

const isComment = (value: unknown): value is Comment =>
  hasStringFields(value, ['id', 'author', 'date', 'content']);

const isPost = (value: unknown): value is Post =>
  hasStringFields(value, ['id', 'title', 'slug', 'image']) &&
  Array.isArray(value.categories) &&
  value.categories.every((category) => typeof category === 'string') &&
  Array.isArray(value.content) &&
  value.content.every((paragraph) => typeof paragraph === 'string') &&
  (value.additionalImages === undefined ||
    (Array.isArray(value.additionalImages) && value.additionalImages.every((image) => typeof image === 'string'))) &&
  (value.videoUrl === undefined || typeof value.videoUrl === 'string') &&
  (value.comments === undefined || (Array.isArray(value.comments) && value.comments.every(isComment)));

const isVideo = (value: unknown): value is VideoItem =>
  hasStringFields(value, ['id', 'title', 'thumbnail', 'description']) &&
  (value.videoUrl === undefined || normalizeVideoUrl(value.videoUrl) !== null) &&
  (value.isPremium === undefined || typeof value.isPremium === 'boolean') &&
  (value.isPremium !== true || (typeof value.videoUrl === 'string' && (() => {
    try {
      const url = new URL(value.videoUrl);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch {
      return false;
    }
  })()));

const isGalleryImage = (value: unknown): value is GalleryImage =>
  hasStringFields(value, ['id', 'url']);

const isShopProduct = (value: unknown): value is ShopProduct =>
  hasStringFields(value, ['id', 'title', 'category', 'priceLabel', 'description', 'image']) &&
  typeof value.price === 'number' && Number.isFinite(value.price) &&
  typeof value.rating === 'number' && Number.isFinite(value.rating) &&
  typeof value.reviewsCount === 'number' && Number.isFinite(value.reviewsCount) &&
  typeof value.inStock === 'boolean' &&
  Array.isArray(value.images) && value.images.length > 0 && value.images.every((image) => typeof image === 'string') &&
  Array.isArray(value.features) && value.features.every((feature) => typeof feature === 'string') &&
  (value.videoUrls === undefined || (
    Array.isArray(value.videoUrls) &&
    (value.videoUrls.length === 0 || value.videoUrls.length >= 2) &&
    value.videoUrls.every((url) => typeof url === 'string')
  )) &&
  (value.videoUrl === undefined || (
    typeof value.videoUrl === 'string' &&
    Array.isArray(value.videoUrls) &&
    value.videoUrls.length >= 2
  ));

type PremiumSessionRow = {
  id: string;
  token_hash: string;
  entitlement_id: string | null;
  expires_at: number;
  revoked_at: number | null;
};

type PaymentRow = {
  id: string;
  reference: string;
  provider_transaction_id: string | null;
  amount_tzs: number;
  status: string;
  browser_session_id: string | null;
  entitlement_id: string | null;
};

const premiumCookie = (token: string, maxAgeMs: number) =>
  `${PREMIUM_SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.max(0, Math.floor(maxAgeMs / 1000))}${secureCookie ? '; Secure' : ''}`;

const hashPremiumToken = (token: string) => createHash('sha256').update(token).digest('hex');

const getPremiumSession = (request: Request, allowExpired = false) => {
  const token = readCookie(request, PREMIUM_SESSION_COOKIE);
  if (!token) return null;
  const session = database.prepare(`
    select id, token_hash, entitlement_id, expires_at, revoked_at
    from premium_sessions where token_hash = ? and revoked_at is null
  `).get(hashPremiumToken(token)) as PremiumSessionRow | undefined;
  if (!session || (!allowExpired && session.expires_at <= Date.now())) return null;
  return { session, token };
};

const getActiveEntitlement = (session: PremiumSessionRow | null) => {
  if (!session?.entitlement_id) return null;
  const entitlement = database.prepare(`
    select id, starts_at, expires_at, status from entitlements
    where id = ? and status = 'active' and starts_at <= ? and expires_at > ?
  `).get(session.entitlement_id, Date.now(), Date.now()) as
    { id: string; starts_at: number; expires_at: number; status: string } | undefined;
  return entitlement ?? null;
};

const setPremiumCookie = (response: Response, token: string, expiresAt: number) => {
  response.setHeader('Set-Cookie', premiumCookie(token, expiresAt - Date.now()));
};

const sameOriginPaymentRequest: RequestHandler = (request, response, next) => {
  const originHeader = request.get('origin');
  try {
    const expectedHost = request.get('host');
    const origin = originHeader ? new URL(originHeader) : null;
    const validProtocol = origin && (secureCookie ? origin.protocol === 'https:' : ['http:', 'https:'].includes(origin.protocol));
    if (!origin || !validProtocol || origin.host !== expectedHost) {
      response.status(403).json({ error: 'Payment request origin could not be verified.' });
      return;
    }
  } catch {
    response.status(403).json({ error: 'Payment request origin could not be verified.' });
    return;
  }
  next();
};

const paymentAttempts = new Map<string, number[]>();
const limitPaymentCreation: RequestHandler = (request, response, next) => {
  const now = Date.now();
  const session = getPremiumSession(request);
  const key = session?.session.id || request.ip || 'unknown';
  const recentAttempts = (paymentAttempts.get(key) || []).filter((time) => now - time < 60_000);
  if (recentAttempts.length >= 5) {
    response.status(429).json({ error: 'Too many payment attempts. Please wait a minute and try again.' });
    return;
  }
  recentAttempts.push(now);
  paymentAttempts.set(key, recentAttempts);
  next();
};

const fastLipaHeaders = () => {
  const token = process.env.FASTLIPA_API_TOKEN?.trim();
  if (!token) throw new Error('FastLipa is not configured.');
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
};

const readProviderTransaction = async (transactionId: string) => {
  const url = new URL('https://api.fastlipa.com/v1/transaction/status');
  url.searchParams.set('tranid', transactionId);
  const result = await fetch(url, { headers: fastLipaHeaders(), signal: AbortSignal.timeout(12_000) });
  const body: unknown = await result.json().catch(() => null);
  if (!result.ok || !isRecord(body) || body.status !== true || !isRecord(body.data)) {
    throw new Error('FastLipa transaction status is unavailable.');
  }
  return body.data;
};

const completePayment = (paymentId: string, providerData: Record<string, unknown>) => {
  const payment = database.prepare('select * from payments where id = ?').get(paymentId) as PaymentRow | undefined;
  if (
    !payment ||
    providerData.payment_status !== 'COMPLETED' ||
    normalizeTzsAmount(providerData.amount) !== payment.amount_tzs ||
    typeof providerData.tranid !== 'string' ||
    (payment.provider_transaction_id && providerData.tranid !== payment.provider_transaction_id)
  ) return false;

  const now = Date.now();
  return database.transaction(() => {
    const currentPayment = database.prepare('select * from payments where id = ?').get(paymentId) as PaymentRow | undefined;
    if (!currentPayment || currentPayment.status === 'completed') return currentPayment?.status === 'completed';
    if (currentPayment.status !== 'pending' || !currentPayment.browser_session_id) return false;

    const session = database.prepare(`
      select id, token_hash, entitlement_id, expires_at, revoked_at
      from premium_sessions where id = ? and revoked_at is null
    `).get(currentPayment.browser_session_id) as PremiumSessionRow | undefined;
    if (!session) return false;

    const existingEntitlement = session.entitlement_id
      ? database.prepare('select id, starts_at, expires_at, status from entitlements where id = ?')
        .get(session.entitlement_id) as { id: string; starts_at: number; expires_at: number; status: string } | undefined
      : undefined;
    const activeExpiry = existingEntitlement?.status === 'active' && existingEntitlement.expires_at > now
      ? existingEntitlement.expires_at
      : null;
    const window = getEntitlementWindow(activeExpiry, now, PREMIUM_ACCESS_DURATION_MS);
    let entitlementId = existingEntitlement?.id;

    if (activeExpiry && entitlementId) {
      database.prepare('update entitlements set expires_at = ?, updated_at = ? where id = ?')
        .run(window.expiresAt, now, entitlementId);
    } else {
      entitlementId = randomUUID();
      database.prepare(`
        insert into entitlements (id, payment_id, status, starts_at, expires_at, created_at, updated_at)
        values (?, ?, 'active', ?, ?, ?, ?)
      `).run(entitlementId, currentPayment.id, window.startsAt, window.expiresAt, now, now);
    }

    database.prepare(`
      update payments set status = 'completed', provider_transaction_id = ?, entitlement_id = ?,
        confirmed_at = ?, updated_at = ? where id = ?
    `).run(providerData.tranid, entitlementId, now, now, currentPayment.id);
    database.prepare('update premium_sessions set entitlement_id = ?, expires_at = ? where id = ?')
      .run(entitlementId, window.expiresAt, session.id);
    return true;
  })();
};

const markPaymentCancelled = (paymentId: string) => {
  database.prepare(`
    update payments set status = 'cancelled', updated_at = ? where id = ? and status = 'pending'
  `).run(Date.now(), paymentId);
};

const markPaymentFailed = (paymentId: string) => {
  database.prepare(`
    update payments set status = 'failed', updated_at = ? where id = ? and status = 'pending'
  `).run(Date.now(), paymentId);
};

const getVideo = (videoId: string): VideoItem | null => {
  const row = database.prepare('select data from videos where id = ?').get(videoId) as { data: string } | undefined;
  return row ? JSON.parse(row.data) as VideoItem : null;
};

app.get('/api/access/status', (request, response) => {
  response.setHeader('Cache-Control', 'private, no-store');
  const current = getPremiumSession(request);
  const entitlement = getActiveEntitlement(current?.session ?? null);
  const pendingPayment = current
    ? database.prepare(`
      select reference from payments where browser_session_id = ? and status = 'pending' and dismissed_at is null
      order by created_at desc limit 1
    `).get(current.session.id) as { reference: string } | undefined
    : undefined;
  response.json({
    active: Boolean(entitlement),
    expiresAt: entitlement ? new Date(entitlement.expires_at).toISOString() : null,
    pendingReference: pendingPayment?.reference ?? null,
  });
});

app.post('/api/payments/abandon', sameOriginPaymentRequest, (request, response) => {
  response.setHeader('Cache-Control', 'private, no-store');
  const current = getPremiumSession(request);
  if (!current) {
    response.status(401).json({ error: 'Payment session is unavailable.' });
    return;
  }
  const reference = isRecord(request.body) ? request.body.reference : null;
  if (typeof reference !== 'string' || !reference) {
    response.status(400).json({ error: 'A payment reference is required.' });
    return;
  }
  const result = database.prepare(`
    update payments set dismissed_at = ?, updated_at = ?
    where reference = ? and browser_session_id = ? and status = 'pending' and dismissed_at is null
  `).run(Date.now(), Date.now(), reference, current.session.id);
  response.json({ abandoned: result.changes > 0 });
});

app.post('/api/payments/create', sameOriginPaymentRequest, limitPaymentCreation, async (request, response) => {
  const phone = normalizeTanzanianPhone(isRecord(request.body) ? request.body.phone : null);
  if (!phone) {
    response.status(400).json({ error: 'Enter a Tanzanian mobile number starting with 06 or 07.' });
    return;
  }
  if (!process.env.FASTLIPA_API_TOKEN?.trim()) {
    response.status(503).json({ error: 'Mobile money payment is not configured yet.' });
    return;
  }
  if (process.env.PREMIUM_MEDIA_PROTECTION_CONFIRMED !== 'true') {
    response.status(503).json({ error: 'Protected premium video delivery has not been confirmed by the site operator.' });
    return;
  }

  const now = Date.now();
  const existing = getPremiumSession(request);
  const token = existing?.token ?? randomBytes(32).toString('base64url');
  const sessionId = existing?.session.id ?? randomUUID();
  const flowExpiresAt = now + PREMIUM_FLOW_SESSION_MS;
  if (existing) {
    database.prepare('update premium_sessions set expires_at = ? where id = ?').run(flowExpiresAt, sessionId);
  } else {
    database.prepare(`
      insert into premium_sessions (id, token_hash, entitlement_id, created_at, expires_at)
      values (?, ?, null, ?, ?)
    `).run(sessionId, hashPremiumToken(token), now, flowExpiresAt);
  }
  setPremiumCookie(response, token, flowExpiresAt);

  const paymentId = randomUUID();
  const reference = `books-${randomUUID()}`;
  database.transaction(() => {
    database.prepare(`
      update payments set dismissed_at = ?, updated_at = ?
      where browser_session_id = ? and status = 'pending' and dismissed_at is null
    `).run(now, now, sessionId);
    database.prepare(`
      insert into payments (id, reference, provider, amount_tzs, currency, product_id, status, created_at, updated_at, browser_session_id)
      values (?, ?, 'fastlipa', ?, 'TZS', ?, 'pending', ?, ?, ?)
    `).run(paymentId, reference, PREMIUM_PRICE_TZS, PREMIUM_PRODUCT_ID, now, now, sessionId);
  })();

  const payload: Record<string, unknown> = {
    number: phone,
    amount: PREMIUM_PRICE_TZS,
    reference,
    name: 'Chombezo Premium Videos',
  };

  try {
    const result = await fetch('https://api.fastlipa.com/v1/transaction/create', {
      method: 'POST',
      headers: { ...fastLipaHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    const body: unknown = await result.json().catch(() => null);
    if (!result.ok || !isRecord(body) || body.status !== true || !isRecord(body.data)) {
      const providerCode = isRecord(body) && typeof body.code === 'string'
        ? body.code.slice(0, 80)
        : undefined;
      const providerMessage = isRecord(body) && typeof body.message === 'string'
        ? body.message.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 300)
        : undefined;
      console.error('[payment-error] FastLipa rejected payment initiation.', {
        httpStatus: result.status,
        providerCode,
        providerMessage,
      });
      database.prepare(`update payments set status = 'failed', updated_at = ? where id = ? and status = 'pending'`)
        .run(Date.now(), paymentId);
      response.status(502).json({
        error: 'FastLipa could not start the payment. Please try again.',
        ...(providerCode ? { providerCode } : {}),
        ...(providerMessage ? { providerMessage } : {}),
      });
      return;
    }
    const transactionId = body.data.tranID;
    if (typeof transactionId !== 'string' || !transactionId) {
      console.error('[payment-error] FastLipa accepted payment without a transaction identifier.', {
        httpStatus: result.status,
      });
      database.prepare(`update payments set status = 'failed', updated_at = ? where id = ? and status = 'pending'`)
        .run(Date.now(), paymentId);
      response.status(502).json({ error: 'FastLipa did not return a transaction identifier.' });
      return;
    }
    database.prepare('update payments set provider_transaction_id = ?, updated_at = ? where id = ?')
      .run(transactionId, Date.now(), paymentId);
    response.status(202).json({ reference, status: 'pending', amount: PREMIUM_PRICE_TZS, currency: 'TZS' });
  } catch {
    response.status(503).json({ error: 'FastLipa could not be reached. Check payment status before retrying.' });
  }
});

app.get('/api/payments/status/:reference', async (request, response) => {
  response.setHeader('Cache-Control', 'private, no-store');
  const current = getPremiumSession(request);
  if (!current) {
    response.status(404).json({ error: 'Payment status is unavailable.' });
    return;
  }
  const payment = database.prepare('select * from payments where reference = ? and browser_session_id = ?')
    .get(request.params.reference, current.session.id) as PaymentRow | undefined;
  if (!payment) {
    response.status(404).json({ error: 'Payment status is unavailable.' });
    return;
  }

  if (payment.status === 'pending' && payment.provider_transaction_id) {
    try {
      const providerData = await readProviderTransaction(payment.provider_transaction_id);
      if (
        providerData.tranid !== payment.provider_transaction_id ||
        normalizeTzsAmount(providerData.amount) !== payment.amount_tzs
      ) {
        response.status(502).json({ error: 'FastLipa transaction details did not match this purchase.' });
        return;
      }
      if (providerData.payment_status === 'COMPLETED') completePayment(payment.id, providerData);
      else if (providerData.payment_status === 'CANCELLED') markPaymentCancelled(payment.id);
      else if (providerData.payment_status === 'FAILED' || providerData.payment_status === 'REJECTED') markPaymentFailed(payment.id);
    } catch {
      response.status(503).json({ error: 'Payment confirmation is temporarily unavailable.' });
      return;
    }
  }

  const refreshedPayment = database.prepare('select status from payments where id = ?').get(payment.id) as { status: string };
  const refreshedSession = database.prepare(`
    select id, token_hash, entitlement_id, expires_at, revoked_at
    from premium_sessions where id = ? and revoked_at is null
  `).get(current.session.id) as PremiumSessionRow | undefined;
  const entitlement = getActiveEntitlement(refreshedSession ?? null);
  if (entitlement) setPremiumCookie(response, current.token, entitlement.expires_at);
  response.json({
    status: refreshedPayment.status,
    accessActive: Boolean(entitlement),
    expiresAt: entitlement ? new Date(entitlement.expires_at).toISOString() : null,
  });
});

app.get('/api/admin/videos', requireAdmin, (_request, response) => {
  response.json(queryData<VideoItem>('select data from videos order by created_at desc'));
});

app.post('/api/admin/featured-video', requireAdmin, (request, response) => {
  const videoId = isRecord(request.body) ? request.body.videoId : undefined;
  if (videoId !== null && typeof videoId !== 'string') {
    response.status(400).json({ error: 'A video ID or null is required.' });
    return;
  }
  if (videoId !== null && !database.prepare('select 1 from videos where id = ?').get(videoId)) {
    response.status(404).json({ error: 'The selected video does not exist.' });
    return;
  }

  if (videoId === null) {
    database.prepare('delete from app_settings where key = ?').run('featured_video_id');
  } else {
    database.prepare(`
      insert into app_settings (key, value) values ('featured_video_id', ?)
      on conflict(key) do update set value = excluded.value
    `).run(videoId);
  }

  const savedId = database.prepare('select value from app_settings where key = ?')
    .get('featured_video_id') as { value: string } | undefined;
  const fallbackId = (database.prepare('select id from videos order by created_at desc limit 1')
    .get() as { id: string } | undefined)?.id ?? null;
  response.json({ featuredVideoId: savedId?.value ?? fallbackId });
});

app.get('/api/videos/:id/playback', (request, response) => {
  response.setHeader('Cache-Control', 'private, no-store');
  const video = getVideo(request.params.id);
  const videoUrl = normalizeVideoUrl(video?.videoUrl);
  if (!video || !videoUrl) {
    if (video?.videoUrl) {
      response.status(422).json({ error: 'This video has an invalid URL. Update it with one complete video link.' });
      return;
    }
    response.status(404).json({ error: 'Video playback is unavailable.' });
    return;
  }
  if (video.isPremium && !getActiveEntitlement(getPremiumSession(request)?.session ?? null)) {
    response.status(403).json({ error: 'Premium access is required to watch this video.' });
    return;
  }
  const source = new URL(videoUrl);
  const format = source.pathname.toLowerCase().endsWith('.m3u8') ? 'hls' : 'file';
  if (!video.isPremium && source.protocol !== 'https:') {
    response.json({ url: videoUrl, format });
    return;
  }
  try {
    resolveAllowedMediaUrl(videoUrl, videoUrl, `${source.pathname}${source.search}`);
    const resource = encodeURIComponent(`${source.pathname}${source.search}`);
    response.json({ url: `/api/videos/${encodeURIComponent(video.id)}/stream?resource=${resource}`, format });
  } catch {
    response.status(503).json({ error: 'This video source cannot be played through the secure stream.' });
  }
});

app.get('/api/videos/:id/stream', async (request, response) => {
  response.setHeader('Cache-Control', 'private, no-store');
  const video = getVideo(request.params.id);
  const videoUrl = normalizeVideoUrl(video?.videoUrl);
  if (!video || !videoUrl) {
    if (video?.videoUrl) {
      response.status(422).json({ error: 'This video has an invalid URL.' });
      return;
    }
    response.status(404).json({ error: 'Video stream is unavailable.' });
    return;
  }
  if (video.isPremium && !getActiveEntitlement(getPremiumSession(request)?.session ?? null)) {
    response.status(403).json({ error: 'Premium access is required to watch this video.' });
    return;
  }
  const resource = typeof request.query.resource === 'string' ? request.query.resource : null;
  if (!resource) {
    response.status(400).json({ error: 'Invalid video resource.' });
    return;
  }

  try {
    const source = new URL(videoUrl);
    const target = resolveAllowedMediaUrl(videoUrl, videoUrl, resource);
    const headers = new Headers();
    for (const header of ['range', 'if-range', 'if-none-match']) {
      const value = request.get(header);
      if (value) headers.set(header, value);
    }
    const referer = request.get('referer');
    headers.set('Referer', referer || `${request.protocol}://${request.get('host')}/`);
    const upstream = await fetch(target, {
      headers,
      redirect: 'error',
      signal: AbortSignal.timeout(30_000),
    });
    const isManifest = target.pathname.toLowerCase().endsWith('.m3u8') ||
      upstream.headers.get('content-type')?.includes('mpegurl');
    response.status(upstream.status);
    for (const header of ['content-type', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
      const value = upstream.headers.get(header);
      if (value) response.setHeader(header, value);
    }
    if (isManifest && upstream.ok) {
      const rewritten = rewriteHlsManifest(await upstream.text(), videoUrl, target.toString(), video.id);
      response.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      response.setHeader('Content-Length', Buffer.byteLength(rewritten));
      response.end(rewritten);
      return;
    }
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) response.setHeader('Content-Length', contentLength);
    if (!upstream.body) {
      response.end();
      return;
    }
    Readable.from(upstream.body as unknown as AsyncIterable<Uint8Array>)
      .on('error', () => response.destroy())
      .pipe(response);
  } catch {
    if (!response.headersSent) response.status(502).json({ error: 'Video stream is temporarily unavailable.' });
    else response.destroy();
  }
});

app.get('/api/content', (_request, response) => {
  const posts = queryData<Post>('select data from posts order by created_at desc');
  const videos = queryData<VideoItem>('select data from videos order by created_at desc');
  const savedFeaturedVideo = database.prepare('select value from app_settings where key = ?')
    .get('featured_video_id') as { value: string } | undefined;
  const featuredVideoId = savedFeaturedVideo && videos.some((video) => video.id === savedFeaturedVideo.value)
    ? savedFeaturedVideo.value
    : videos[0]?.id ?? null;
  const comments = database.prepare('select post_id, data from post_comments order by created_at asc')
    .all() as Array<{ post_id: string; data: string }>;
  const commentsByPost = new Map<string, Comment[]>();
  for (const row of comments) {
    const postComments = commentsByPost.get(row.post_id) ?? [];
    postComments.push(JSON.parse(row.data) as Comment);
    commentsByPost.set(row.post_id, postComments);
  }
  response.json({
    posts: posts.map((post) => ({ ...post, comments: commentsByPost.get(post.id) ?? [] })),
    videos: videos.map(publicVideo),
    featuredVideoId,
    galleryImages: queryData<GalleryImage>('select data from gallery_images order by created_at desc'),
    products: queryData<ShopProduct>('select data from products order by created_at desc'),
  });
});

app.post('/api/content/import-local', requireAdmin, (request, response) => {
  const { posts, videos, galleryImages } = isRecord(request.body) ? request.body : {};
  const videoCatalogReplaced = Boolean(database.prepare('select value from app_settings where key = ?')
    .get('storage_video_catalog_replaced'));
  if (
    !Array.isArray(posts) ||
    !posts.every(isPost) ||
    !Array.isArray(videos) ||
    (!videoCatalogReplaced && !videos.every(isVideo)) ||
    !Array.isArray(galleryImages) ||
    !galleryImages.every(isGalleryImage)
  ) {
    response.status(400).json({ error: 'Legacy browser content has an invalid format.' });
    return;
  }

  const migrationKey = 'legacy_localstorage_imported';
  if (database.prepare('select value from app_settings where key = ?').get(migrationKey)) {
    response.json({ imported: false });
    return;
  }

  const importLegacyContent = database.transaction(() => {
    for (const [index, post] of posts.entries()) {
      const { comments = [], ...postData } = post;
      database.prepare(`
        insert into posts (id, slug, data, created_at) values (?, ?, ?, ?)
        on conflict(id) do update set slug = excluded.slug, data = excluded.data
      `).run(post.id, post.slug, JSON.stringify(postData), Date.now() + posts.length - index);
      for (const comment of comments) {
        database.prepare('insert or ignore into post_comments (id, post_id, data) values (?, ?, ?)')
          .run(comment.id, post.id, JSON.stringify(comment));
      }
    }
    if (!videoCatalogReplaced) {
      for (const video of videos) {
        database.prepare(`
          insert into videos (id, data) values (?, ?)
          on conflict(id) do update set data = excluded.data
        `).run(video.id, JSON.stringify(video));
      }
    }
    for (const image of galleryImages) {
      database.prepare(`
        insert into gallery_images (id, data) values (?, ?)
        on conflict(id) do update set data = excluded.data
      `).run(image.id, JSON.stringify(image));
    }
    database.prepare('insert into app_settings (key, value) values (?, ?)').run(migrationKey, 'true');
  });
  importLegacyContent();
  response.json({ imported: true });
});

app.post('/api/posts', requireAdmin, (request, response) => {
  const post = request.body as Post;
  if (!isPost(post)) {
    response.status(400).json({ error: 'A post requires an id, title, slug, image, categories, and content.' });
    return;
  }
  const { comments: _comments, ...storedPost } = post;
  database.prepare(`
    insert into posts (id, slug, data, created_at) values (?, ?, ?, ?)
    on conflict(id) do update set slug = excluded.slug, data = excluded.data
  `).run(post.id, post.slug, JSON.stringify(storedPost), Date.now());
  response.json({ success: true });
});

app.delete('/api/posts/:id', requireAdmin, (request, response) => {
  database.prepare('delete from posts where id = ?').run(request.params.id);
  response.json({ success: true });
});

app.post('/api/videos', requireAdmin, (request, response) => {
  const video = request.body as VideoItem;
  if (!isVideo(video)) {
    response.status(400).json({ error: 'A video needs an id, title, thumbnail, description, and one valid video URL.' });
    return;
  }
  database.prepare(`
    insert into videos (id, data) values (?, ?)
    on conflict(id) do update set data = excluded.data
  `).run(video.id, JSON.stringify(video));
  response.json({ success: true });
});

app.delete('/api/videos/:id', requireAdmin, (request, response) => {
  database.prepare('delete from videos where id = ?').run(request.params.id);
  database.prepare('delete from app_settings where key = ? and value = ?')
    .run('featured_video_id', request.params.id);
  response.json({ success: true });
});

app.post('/api/gallery', requireAdmin, (request, response) => {
  const image = request.body as GalleryImage;
  if (!isGalleryImage(image)) {
    response.status(400).json({ error: 'A gallery image requires an id and URL.' });
    return;
  }
  database.prepare(`
    insert into gallery_images (id, data) values (?, ?)
    on conflict(id) do update set data = excluded.data
  `).run(image.id, JSON.stringify(image));
  response.json({ success: true });
});

app.delete('/api/gallery/:id', requireAdmin, (request, response) => {
  database.prepare('delete from gallery_images where id = ?').run(request.params.id);
  response.json({ success: true });
});

app.post('/api/products', requireAdmin, (request, response) => {
  const product = request.body as ShopProduct;
  if (!isShopProduct(product)) {
    response.status(400).json({ error: 'A product requires a title, image link, description, and valid product details.' });
    return;
  }
  database.prepare(`
    insert into products (id, data, created_at) values (?, ?, ?)
    on conflict(id) do update set data = excluded.data
  `).run(product.id, JSON.stringify(product), Date.now());
  response.json({ success: true });
});

app.delete('/api/products/:id', requireAdmin, (request, response) => {
  database.prepare('delete from products where id = ?').run(request.params.id);
  response.json({ success: true });
});

app.post('/api/posts/:id/comments', (request, response) => {
  const comment = request.body as Comment;
  const postId = request.params.id;
  if (!isComment(comment)) {
    response.status(400).json({ error: 'A comment requires an id, author, date, and content.' });
    return;
  }
  const postExists = database.prepare('select 1 from posts where id = ?').get(postId);
  if (!postExists) {
    response.status(404).json({ error: 'The requested post does not exist.' });
    return;
  }
  database.prepare('insert into post_comments (id, post_id, data) values (?, ?, ?)')
    .run(comment.id, postId, JSON.stringify(comment));
  response.json({ success: true });
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API endpoint not found.' });
});

app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (isRecord(error) && typeof error.status === 'number') {
    const message = error.status === 413 ? 'Request body is too large.' : 'Invalid request.';
    response.status(error.status).json({ error: message });
    return;
  }
  if (isRecord(error) && typeof error.code === 'string' && error.code.startsWith('SQLITE_CONSTRAINT')) {
    response.status(409).json({ error: 'This content conflicts with an existing record.' });
    return;
  }
  console.error('Request failed:', error);
  response.status(500).json({ error: 'An unexpected server error occurred.' });
});

const port = Number(process.env.PORT || 3000);

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(projectRoot, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_request, response) => {
    response.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const vite = await createViteServer({
    configFile: path.join(projectRoot, 'vite.config.ts'),
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
    },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  app.use('*', async (request, response, next) => {
    try {
      const template = readFileSync(path.join(projectRoot, 'index.html'), 'utf-8');
      const html = await vite.transformIndexHtml(request.originalUrl, template);
      response.status(200).setHeader('Content-Type', 'text/html').end(html);
    } catch (error) {
      vite.ssrFixStacktrace(error as Error);
      next(error);
    }
  });
}

httpServer.listen(port, () => {
  console.log(`Website and local SQLite API listening on port ${port}`);
  console.log(`SQLite database: ${databasePath}`);
});

const shutdown = () => {
  httpServer.close(() => {
    database.close();
    process.exit(0);
  });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
