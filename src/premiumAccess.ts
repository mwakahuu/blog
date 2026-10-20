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

export const normalizeTzsAmount = (value: unknown): number | null => {
  const amount = typeof value === 'number'
    ? value
    : typeof value === 'string' && /^\d+$/.test(value.trim())
      ? Number(value.trim())
      : NaN;
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
};

export const getEntitlementWindow = (
  currentExpiry: number | null,
  now: number,
  duration = PREMIUM_ACCESS_DURATION_MS,
): { startsAt: number; expiresAt: number } => {
  const startsAt = currentExpiry !== null && currentExpiry > now ? currentExpiry : now;
  return { startsAt, expiresAt: startsAt + duration };
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
): URL => {
  const source = new URL(sourceUrl);
  const target = new URL(resource, currentUrl);
  const rootPath = source.pathname.slice(0, source.pathname.lastIndexOf('/') + 1);

  if (
    source.protocol !== 'https:' ||
    source.username ||
    source.password ||
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
): string => {
  const proxyUrl = (uri: string) => {
    const target = resolveAllowedMediaUrl(sourceUrl, currentUrl, uri);
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
