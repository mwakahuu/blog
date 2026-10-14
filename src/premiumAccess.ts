import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const PREMIUM_PRICE_TZS = 3000;
export const PREMIUM_PRODUCT_ID = 'all-premium-5h';
export const PREMIUM_ACCESS_DURATION_MS = 5 * 60 * 60 * 1000;
export const PREMIUM_FLOW_SESSION_MS = 24 * 60 * 60 * 1000;
export const PREMIUM_SESSION_COOKIE = 'blog_premium_session';

export const normalizeTanzanianPhone = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const phone = value.trim();
  return /^0[67]\d{8}$/.test(phone) ? `255${phone.slice(1)}` : null;
};

export const verifyFastLipaSignature = (
  rawBody: Buffer,
  signature: string | undefined,
  secret: string | undefined,
): boolean => {
  if (!secret || !signature) return false;
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
};

export const getEntitlementWindow = (
  currentExpiry: number | null,
  now: number,
  duration = PREMIUM_ACCESS_DURATION_MS,
): { startsAt: number; expiresAt: number } => {
  const startsAt = currentExpiry !== null && currentExpiry > now ? currentExpiry : now;
  return { startsAt, expiresAt: startsAt + duration };
};

export const createBunnyTokenUrl = (url: URL, key: string, expiresAt: number): URL => {
  const signedUrl = new URL(url);
  const expiry = String(expiresAt);
  const digest = createHash('sha256').update(`${key}${signedUrl.pathname}${expiry}`).digest();
  const token = digest.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  signedUrl.searchParams.set('token', token);
  signedUrl.searchParams.set('expires', expiry);
  return signedUrl;
};

export const publicVideo = <T extends { isPremium?: boolean; videoUrl?: string }>(video: T): T => {
  if (!video.isPremium) return video;
  const { videoUrl: _videoUrl, ...metadata } = video;
  return metadata as T;
};

export const resolveAllowedMediaUrl = (
  sourceUrl: string,
  currentUrl: string,
  resource: string,
  allowedHosts: ReadonlySet<string>,
): URL => {
  const source = new URL(sourceUrl);
  const target = new URL(resource, currentUrl);
  const rootPath = source.pathname.slice(0, source.pathname.lastIndexOf('/') + 1);

  if (
    source.protocol !== 'https:' ||
    source.username ||
    source.password ||
    !allowedHosts.has(source.hostname.toLowerCase()) ||
    target.origin !== source.origin ||
    !target.pathname.startsWith(rootPath)
  ) {
    throw new Error('Media resource is outside the configured video source.');
  }

  return target;
};

export const rewriteHlsManifest = (
  manifest: string,
  sourceUrl: string,
  currentUrl: string,
  videoId: string,
  allowedHosts: ReadonlySet<string>,
): string => {
  const proxyUrl = (uri: string) => {
    const target = resolveAllowedMediaUrl(sourceUrl, currentUrl, uri, allowedHosts);
    const resource = encodeURIComponent(`${target.pathname}${target.search}`);
    return `/api/videos/${encodeURIComponent(videoId)}/stream?resource=${resource}`;
  };

  return manifest.split(/\r?\n/).map((line) => {
    if (line.startsWith('#')) {
      return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => `URI="${proxyUrl(uri)}"`);
    }
    return line ? proxyUrl(line) : line;
  }).join('\n');
};
