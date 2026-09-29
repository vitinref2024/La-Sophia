/**
 * Helper to safely encode image URLs that may contain spaces or accented characters.
 * Ensures compatibility across browsers, Vercel Edge CDN, and strict proxies,
 * and attaches a cache-busting version parameter (?v=2) to local assets.
 */
export function safeImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  // Keep external URLs and Vite internal module asset imports intact
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('/@') ||
    url.includes('/@fs/') ||
    url.startsWith('/src/assets')
  ) {
    return url;
  }
  try {
    const [pathPart, queryPart] = url.split('?');
    const encodedPath = encodeURI(decodeURI(pathPart));
    const versionQuery = queryPart ? queryPart : 'v=2';
    return `${encodedPath}?${versionQuery}`;
  } catch {
    const [pathPart, queryPart] = url.split('?');
    const versionQuery = queryPart ? queryPart : 'v=2';
    return `${encodeURI(pathPart)}?${versionQuery}`;
  }
}
