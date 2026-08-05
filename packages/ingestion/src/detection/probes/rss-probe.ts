import { NormalizedEvent } from '../../types';

export interface ProbeResult {
  success: boolean;
  detectedType: 'rss' | 'api' | 'html_listing' | 'generic_html';
  extractorPlugin: string;
  confidenceScore: number;
  reason: string;
  recommendedIntervalSec: number;
  expectedDailyUpdates: string;
  metadataSupported: string[];
  feedUrl?: string;
  previewItems: NormalizedEvent[];
}

export class RssProbe {
  public static async probe(normalizedUrl: string, rawHtml?: string): Promise<ProbeResult | null> {
    const candidateUrls: string[] = [normalizedUrl];

    // Inspect HTML for <link rel="alternate" type="application/rss+xml">
    if (rawHtml) {
      const linkMatches = rawHtml.match(/<link[^>]*rel=["']alternate["'][^>]*href=["'](.*?)["']/gi);
      if (linkMatches) {
        for (const match of linkMatches) {
          const hrefMatch = match.match(/href=["'](.*?)["']/i);
          if (hrefMatch && hrefMatch) {
            let href = hrefMatch;
            if (href.startsWith('/')) {
              const parsed = new URL(normalizedUrl);
              href = `${parsed.protocol}//${parsed.host}${href}`;
            }
            candidateUrls.push(href);
          }
        }
      }
    }

    // Common RSS endpoints
    const parsed = new URL(normalizedUrl);
    const base = `${parsed.protocol}//${parsed.host}`;
    candidateUrls.push(`${base}/feed`, `${base}/rss`, `${base}/rss.xml`, `${base}/feed.xml`);

    for (const url of candidateUrls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MarketSentinel/3.0' },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) continue;

        const text = await res.text();
        if (text.includes('<rss') || text.includes('<feed') || text.includes('<channel')) {
          const items = this.parseRssPreviewItems(text, url);
          return {
            success: true,
            detectedType: 'rss',
            extractorPlugin: 'RssPlugin',
            confidenceScore: 100,
            reason: `Official RSS/Atom feed discovered and verified at ${url}`,
            recommendedIntervalSec: 300,
            expectedDailyUpdates: '10–25 updates/day',
            metadataSupported: ['Title', 'Published Date', 'Direct Link', 'Summary / Excerpt'],
            feedUrl: url,
            previewItems: items,
          };
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private static parseRssPreviewItems(xmlText: string, feedUrl: string): NormalizedEvent[] {
    const events: NormalizedEvent[] = [];
    const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>/gi) || xmlText.match(/<entry[\s\S]*?<\/entry>/gi) || [];

    for (let i = 0; i < Math.min(itemMatches.length, 5); i++) {
      const match = itemMatches[i];
      const titleMatch = match.match(/<title[^>]*>(.*?)<\/title>/i);
      const linkMatch = match.match(/<link[^>]*>(.*?)<\/link>/i) || match.match(/<link[^>]*href=["'](.*?)["']/i);
      const descMatch = match.match(/<description[^>]*>(.*?)<\/description>/i) || match.match(/<summary[^>]*>(.*?)<\/summary>/i);

      const title = titleMatch ? titleMatch.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim() : 'Feed Item';
      const link = linkMatch ? linkMatch.replace(/<!\[CDATA\[|\]\]>/g, '').trim() : feedUrl;
      const summary = descMatch ? descMatch.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim() : 'Preview available';

      events.push({
        title,
        url: link,
        publishedAt: new Date(),
        summary: summary.substring(0, 200),
        source: feedUrl,
        contentHash: `preview-${i}`,
        rawContent: summary,
        confidence: 100,
        fetchTime: new Date(),
      });
    }

    return events;
  }
}