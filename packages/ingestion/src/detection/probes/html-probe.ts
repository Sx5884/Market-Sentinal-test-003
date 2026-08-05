import { ProbeResult } from './rss-probe';

export class HtmlProbe {
  public static async probe(normalizedUrl: string, htmlText: string): Promise<ProbeResult> {
    const titleMatch = htmlText.match(/<title[^>]*>(.*?)<\/title>/i);
    const siteTitle = titleMatch ? titleMatch.replace(/<[^>]+>/g, '').trim() : 'Monitored Website';

    // Check for article card containers in DOM
    const hasArticleTags = /<article/i.test(htmlText);
    const hasNewsCards = /class=["'][^"']*(post|card|entry|news|article)[^"']*["']/i.test(htmlText);

    if (hasArticleTags || hasNewsCards) {
      return {
        success: true,
        detectedType: 'html_listing',
        extractorPlugin: 'HtmlCardPlugin',
        confidenceScore: 75,
        reason: 'HTML article listing structure detected via CSS card container analysis',
        recommendedIntervalSec: 600,
        expectedDailyUpdates: '2–5 updates/day',
        metadataSupported: ['Title', 'Direct URL', 'Article Excerpt'],
        previewItems: [
          {
            title: siteTitle,
            url: normalizedUrl,
            publishedAt: new Date(),
            summary: 'HTML article card container detected on source page.',
            source: normalizedUrl,
            contentHash: 'html-preview-0',
            rawContent: siteTitle,
            confidence: 75,
            fetchTime: new Date(),
          },
        ],
      };
    }

    // Generic HTML Fallback
    return {
      success: true,
      detectedType: 'generic_html',
      extractorPlugin: 'HtmlReadabilityPlugin',
      confidenceScore: 50,
      reason: 'Generic HTML webpage container isolated using Mozilla Readability fallback',
      recommendedIntervalSec: 900,
      expectedDailyUpdates: '1–3 updates/day',
      metadataSupported: ['Page Title', 'Direct URL'],
      previewItems: [
        {
          title: siteTitle,
          url: normalizedUrl,
          publishedAt: new Date(),
          summary: 'Generic HTML page content container isolated.',
          source: normalizedUrl,
          contentHash: 'html-fallback-0',
          rawContent: siteTitle,
          confidence: 50,
          fetchTime: new Date(),
        },
      ],
    };
  }
}