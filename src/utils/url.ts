export const BASE_URL = 'https://adetal-ff-production.up.railway.app';

export function fixUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${BASE_URL}${url}`;
  return url;
}
