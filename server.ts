import 'dotenv/config';

import Database from 'better-sqlite3';
import express, { type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import { createServer as createHttpServer } from 'node:http';
import { timingSafeEqual, randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_GALLERY_IMAGES } from './src/data/gallery';
import { VIDEOS } from './src/data/videos';
import type { Comment, GalleryImage, Post, VideoItem } from './src/types';

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
database.prepare('update posts set created_at = created_at * 1000 where created_at < 100000000000').run();

const insertVideo = database.prepare('insert into videos (id, data) values (?, ?)');
const insertGalleryImage = database.prepare('insert into gallery_images (id, data) values (?, ?)');
const seedDefaults = database.transaction(() => {
  const initialized = database.prepare('select value from app_settings where key = ?').get('default_content_seeded');
  if (initialized) return;

  const videoCount = (database.prepare('select count(*) as count from videos').get() as { count: number }).count;
  const galleryCount = (database.prepare('select count(*) as count from gallery_images').get() as { count: number }).count;
  if (videoCount === 0) {
    for (const video of VIDEOS) insertVideo.run(video.id, JSON.stringify(video));
  }
  if (galleryCount === 0) {
    for (const image of INITIAL_GALLERY_IMAGES) insertGalleryImage.run(image.id, JSON.stringify(image));
  }
  database.prepare('insert into app_settings (key, value) values (?, ?)').run('default_content_seeded', 'true');
});
seedDefaults();

const app = express();
const httpServer = createHttpServer(app);
const sessions = new Map<string, number>();
const sessionCookie = 'blog_admin_session';
const sessionLifetimeMs = 12 * 60 * 60 * 1000;
const secureCookie = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
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
  hasStringFields(value, ['id', 'title', 'thumbnail', 'description']);

const isGalleryImage = (value: unknown): value is GalleryImage =>
  hasStringFields(value, ['id', 'url']);

app.get('/api/content', (_request, response) => {
  const posts = queryData<Post>('select data from posts order by created_at desc');
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
    videos: queryData<VideoItem>('select data from videos order by created_at desc'),
    galleryImages: queryData<GalleryImage>('select data from gallery_images order by created_at desc'),
  });
});

app.post('/api/content/import-local', requireAdmin, (request, response) => {
  const { posts, videos, galleryImages } = isRecord(request.body) ? request.body : {};
  if (
    !Array.isArray(posts) ||
    !posts.every(isPost) ||
    !Array.isArray(videos) ||
    !videos.every(isVideo) ||
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
    for (const video of videos) {
      database.prepare(`
        insert into videos (id, data) values (?, ?)
        on conflict(id) do update set data = excluded.data
      `).run(video.id, JSON.stringify(video));
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
    response.status(400).json({ error: 'A video requires an id, title, thumbnail, and description.' });
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
const host = process.env.HOST || '0.0.0.0';

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

httpServer.listen(port, host, () => {
  console.log(`Website and local SQLite API listening on http://${host}:${port}`);
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
