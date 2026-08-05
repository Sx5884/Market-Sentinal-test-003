export class UrlNormalizer {
  public static normalize(rawUrl: string): string {
    let url = rawUrl.trim();

    // Ensure protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      const parsed = new URL(url);
      
      // Remove trailing slash for uniformity
      let pathname = parsed.pathname;
      if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }

      // Strip common tracking query parameters
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
      trackingParams.forEach(param => parsed.searchParams.delete(param));

      return `${parsed.protocol}//${parsed.host}${pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }

  public static getBaseUrl(normalizedUrl: string): string {
    try {
      const parsed = new URL(normalizedUrl);
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return normalizedUrl;
    }
  }
}