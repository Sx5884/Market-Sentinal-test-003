import { ProbeResult } from './rss-probe';

export class ApiProbe {
  public static async probe(normalizedUrl: string): Promise<ProbeResult | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(normalizedUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 MarketSentinel/3.0',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.items || json.articles || json.data || [];

        if (Array.isArray(items) && items.length > 0) {
          const previewItems = items.slice(0, 5).map((item: any, idx: number) => ({
            title: item.title || item.name || item.headline || 'API Item',
            url: item.url || item.link || normalizedUrl,
            publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
            summary: item.summary || item.description || 'JSON API payload response',
            source: normalizedUrl,
            contentHash: `api-preview-${idx}`,
            rawContent: JSON.stringify(item),
            confidence: 85,
            fetchTime: new Date(),
          }));

          return {
            success: true,
            detectedType: 'api',
            extractorPlugin: 'ApiPlugin',
            confidenceScore: 85,
            reason: 'Structured REST API / JSON endpoint detected with item arrays',
            recommendedIntervalSec: 300,
            expectedDailyUpdates: '5–15 updates/day',
            metadataSupported: ['Title', 'Direct URL', 'JSON Payload'],
            previewItems,
          };
        }
      }
    } catch {
      return null;
    }

    return null;
  }
}