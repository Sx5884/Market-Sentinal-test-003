export interface DomainKnowledge {
  domain: string;
  strategy: 'rss' | 'html_listing' | 'api' | 'github' | 'reddit' | 'youtube';
  extractorPlugin: string;
  recommendedIntervalSec: number;
  expectedDailyUpdates: string;
  metadataSupported: string[];
  fallbackStrategy: string;
  knownFeedPath?: string;
}

export class SourceIntelligenceDb {
  private static knowledgeBase: Map<string, DomainKnowledge> = new Map([
    [
      'sec.gov',
      {
        domain: 'sec.gov',
        strategy: 'rss',
        extractorPlugin: 'RssPlugin',
        recommendedIntervalSec: 300,
        expectedDailyUpdates: '15–30 updates/day',
        metadataSupported: ['Title', 'Published Date', 'Direct Link', 'Summary'],
        fallbackStrategy: 'Mozilla Readability',
        knownFeedPath: 'https://www.sec.gov/news/pressreleases.rss',
      },
    ],
    [
      'whitehouse.gov',
      {
        domain: 'whitehouse.gov',
        strategy: 'rss',
        extractorPlugin: 'RssPlugin',
        recommendedIntervalSec: 300,
        expectedDailyUpdates: '5–15 updates/day',
        metadataSupported: ['Title', 'Published Date', 'Direct Link', 'Excerpt'],
        fallbackStrategy: 'Mozilla Readability',
        knownFeedPath: 'https://www.whitehouse.gov/briefing-room/feed/',
      },
    ],
    [
      'reuters.com',
      {
        domain: 'reuters.com',
        strategy: 'rss',
        extractorPlugin: 'RssPlugin',
        recommendedIntervalSec: 600,
        expectedDailyUpdates: '50+ updates/day',
        metadataSupported: ['Title', 'Published Date', 'Direct Link', 'Summary'],
        fallbackStrategy: 'HtmlCardPlugin',
      },
    ],
    [
      'rbi.org.in',
      {
        domain: 'rbi.org.in',
        strategy: 'rss',
        extractorPlugin: 'RssPlugin',
        recommendedIntervalSec: 600,
        expectedDailyUpdates: '3–8 updates/day',
        metadataSupported: ['Press Release Title', 'Published Date', 'Direct Link'],
        fallbackStrategy: 'HtmlCardPlugin',
        knownFeedPath: 'https://rbi.org.in/rss/rss_pressreleases.xml',
      },
    ],
    [
      'ycombinator.com',
      {
        domain: 'ycombinator.com',
        strategy: 'html_listing',
        extractorPlugin: 'HtmlCardPlugin',
        recommendedIntervalSec: 300,
        expectedDailyUpdates: '2–5 updates/day',
        metadataSupported: ['Title', 'Direct Link', 'Excerpt Preview', 'Image'],
        fallbackStrategy: 'Mozilla Readability',
      },
    ],
    [
      'github.com',
      {
        domain: 'github.com',
        strategy: 'api',
        extractorPlugin: 'ApiPlugin',
        recommendedIntervalSec: 900,
        expectedDailyUpdates: '1–5 updates/day',
        metadataSupported: ['Release Version', 'Author', 'Release Notes', 'Direct Link'],
        fallbackStrategy: 'HtmlCardPlugin',
      },
    ],
    [
      'reddit.com',
      {
        domain: 'reddit.com',
        strategy: 'api',
        extractorPlugin: 'ApiPlugin',
        recommendedIntervalSec: 300,
        expectedDailyUpdates: '20+ updates/day',
        metadataSupported: ['Post Title', 'Author', 'Permalink', 'Upvotes'],
        fallbackStrategy: 'RssPlugin',
      },
    ],
  ]);

  public static lookup(url: string): DomainKnowledge | null {
    try {
      const parsed = new URL(url.startsWith('http') ? url : 'https://' + url);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, '');

      for (const [domain, knowledge] of this.knowledgeBase.entries()) {
        if (host === domain || host.endsWith('.' + domain)) {
          console.log(`🧠 [SOURCE INTELLIGENCE] Found pre-seeded domain knowledge for: ${domain}`);
          return knowledge;
        }
      }
    } catch {}

    return null;
  }
}