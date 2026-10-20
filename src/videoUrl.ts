export const normalizeVideoUrl = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  if (!url || /\s/.test(url) || !/^https?:\/\//i.test(url)) return null;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const hasPublicHostname = hostname === 'localhost' || hostname.includes('.') || hostname.startsWith('[');
    const hasEmbeddedUrl = /https?:/i.test(`${parsed.pathname}${parsed.search}${parsed.hash}`);
    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      !hasPublicHostname ||
      parsed.username ||
      parsed.password ||
      hasEmbeddedUrl
    ) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
};
