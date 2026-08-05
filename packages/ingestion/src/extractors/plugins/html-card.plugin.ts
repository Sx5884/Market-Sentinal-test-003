import { ExtractorPlugin, SourceProfile, DownloadedPayload, ExtractedItem } from '../../types';

export class HtmlCardPlugin implements ExtractorPlugin {
  public readonly name = 'HtmlCardPlugin';

  public canHandle(profile: SourceProfile): boolean {
    return profile.monitoringStrategy === 'html_listing' || 
           profile.extractorPlugin === 'HtmlCardPlugin';
  }

  public async extract(payload: DownloadedPayload, profile: SourceProfile): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];
    const html = payload.body;
    const baseUrl = payload.url;

    // 1. Isolate article container blocks using DOM card regex patterns
    const cardBlockRegex = /<(article|div|li)[^>]*class=["'][^"']*(card|post|item|entry|story|news|article|article-card)[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi;
    let cardMatches: RegExpExecArray | null;

    while ((cardMatches = cardBlockRegex.exec(html)) !== null) {
      const cardHtml = cardMatches[0];
      const extracted = this.extractCardMetadata(cardHtml, baseUrl);
      if (extracted && extracted.rawTitle) {
        items.push(extracted);
      }
    }

    // 2. Fallback: Heading links (h2 a, h3 a) if no card containers matched
    if (items.length === 0) {
      const headingLinkRegex = /<h[2-4][^>]*>\s*<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>\s*<\/h[2-4]>/gi;
      let headingMatch: RegExpExecArray | null;

      while ((headingMatch = headingLinkRegex.exec(html)) !== null) {
        const rawHref = headingMatch;
        const rawTitle = headingMatch.replace(/<[^>]+>/g, '').trim();

        if (rawTitle && rawTitle.length > 5) {
          items.push({
            rawTitle,
            rawUrl: this.resolveUrl(rawHref, baseUrl),
            rawSummary: rawTitle,
            rawPublishedAt: new Date(),
          });
        }
      }
    }

    return items;
  }

  private extractCardMetadata(cardHtml: string, baseUrl: string): ExtractedItem | null {
    // Headline & URL
    const linkMatch = cardHtml.match(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/i);
    if (!linkMatch) return null;

    const rawHref = linkMatch;
    let rawTitle = linkMatch.replace(/<[^>]+>/g, '').trim();

    if (!rawTitle) {
      const headingMatch = cardHtml.match(/<h[1-5][^>]*>(.*?)<\/h[1-5]>/i);
      rawTitle = headingMatch ? headingMatch.replace(/<[^>]+>/g, '').trim() : '';
    }

    if (!rawTitle) return null;

    // Excerpt / Summary
    const pMatch = cardHtml.match(/<p[^>]*>(.*?)<\/p>/i);
    const rawSummary = pMatch ? pMatch.replace(/<[^>]+>/g, '').trim() : rawTitle;

    // Published Date / Time Tag
    const timeMatch = cardHtml.match(/<time[^>]*datetime=["']([^"']+)["']/i) || cardHtml.match(/<time[^>]*>(.*?)<\/time>/i);
    const rawPublishedAt = timeMatch ? timeMatch : undefined;

    // Preview Image URL
    const imgMatch = cardHtml.match(/<img[^>]*src=["']([^"']+)["']/i) || cardHtml.match(/<img[^>]*data-src=["']([^"']+)["']/i);
    const rawImage = imgMatch ? this.resolveUrl(imgMatch, baseUrl) : undefined;

    return {
      rawTitle,
      rawUrl: this.resolveUrl(rawHref, baseUrl),
      rawSummary: rawSummary.substring(0, 300),
      rawPublishedAt: rawPublishedAt ? new Date(rawPublishedAt) : new Date(),
      rawImage,
    };
  }

  private resolveUrl(href: string, baseUrl: string): string {
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }
    try {
      const parsed = new URL(baseUrl);
      if (href.startsWith('/')) {
        return `${parsed.protocol}//${parsed.host}${href}`;
      }
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}/${href}`;
    } catch {
      return href;
    }
  }
}