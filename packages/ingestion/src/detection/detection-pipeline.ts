import { MonitoringPlan } from '../types';
import { UrlNormalizer } from './url-normalizer';
import { RssProbe } from './probes/rss-probe';
import { ApiProbe } from './probes/api-probe';
import { HtmlProbe } from './probes/html-probe';
import { SourceIntelligenceDb } from './source-intelligence-db';

export class DetectionPipeline {
  public async detect(rawUrl: string): Promise<MonitoringPlan> {
    const normalizedUrl = UrlNormalizer.normalize(rawUrl);

    // 1. Check Source Intelligence Knowledge Base
    const knownDomain = SourceIntelligenceDb.lookup(normalizedUrl);
    if (knownDomain) {
      return {
        detectedType: knownDomain.strategy as any,
        extractorPlugin: knownDomain.extractorPlugin,
        confidenceScore: 100,
        reason: `Instant 100% detection: Domain "${knownDomain.domain}" verified in Source Intelligence Database.`,
        recommendedIntervalSec: knownDomain.recommendedIntervalSec,
        expectedDailyUpdates: knownDomain.expectedDailyUpdates,
        metadataSupported: knownDomain.metadataSupported,
        fallbackStrategy: knownDomain.fallbackStrategy,
        previewItems: [
          {
            title: `Verified ${knownDomain.domain} Stream`,
            url: knownDomain.knownFeedPath || normalizedUrl,
            publishedAt: new Date(),
            summary: `High-confidence pre-seeded monitoring strategy for ${knownDomain.domain}`,
            source: normalizedUrl,
            contentHash: 'intel-db-preview-0',
            rawContent: knownDomain.domain,
            confidence: 100,
            fetchTime: new Date(),
          },
        ],
      };
    }

    // Initial Fetch for HTML inspection
    let rawHtml = '';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(normalizedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MarketSentinel/3.0' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) rawHtml = await res.text();
    } catch {}

    // 2. Probe RSS / Atom Feed (Confidence: 100%)
    const rssResult = await RssProbe.probe(normalizedUrl, rawHtml);
    if (rssResult) return this.formatPlan(rssResult);

    // 3. Probe REST API / JSON Endpoint (Confidence: 85%)
    const apiResult = await ApiProbe.probe(normalizedUrl);
    if (apiResult) return this.formatPlan(apiResult);

    // 4. HTML DOM Structural Analysis (Confidence: 50–75%)
    const htmlResult = await HtmlProbe.probe(normalizedUrl, rawHtml);
    return this.formatPlan(htmlResult);
  }

  private formatPlan(result: any): MonitoringPlan {
    return {
      detectedType: result.detectedType,
      extractorPlugin: result.extractorPlugin,
      confidenceScore: result.confidenceScore,
      reason: result.reason,
      recommendedIntervalSec: result.recommendedIntervalSec,
      expectedDailyUpdates: result.expectedDailyUpdates,
      metadataSupported: result.metadataSupported,
      previewItems: result.previewItems,
    };
  }
}