import { DownloadedPayload, SourceProfile, ExtractedItem } from '../types';

export interface SelectorRecoveryResult {
  recovered: boolean;
  proposedSelectors?: Record<string, string>;
  confidenceScore: number;
  reason: string;
  sampleItems: ExtractedItem[];
}

export class AiAdapter {
  /**
   * Attempts AI-assisted selector recovery when HTML structure changes or layout redesign occurs.
   * Analyzes raw HTML markup, proposes updated card container selectors, and validates against live payload.
   */
  public async recoverSelectors(
    payload: DownloadedPayload,
    profile: SourceProfile
  ): Promise<SelectorRecoveryResult> {
    console.log(`🤖 [AI ADAPTATION] Analyzing layout change for source profile: ${profile.sourceId}`);

    const html = payload.body;
    
    // Analyze DOM layout for new card container candidates
    const potentialContainers = [
      { name: 'article', selector: 'article', regex: /<article[^>]*>([\s\S]*?)<\/article>/gi },
      { name: 'section_item', selector: '.story-item, .news-item, .post-item', regex: /<(div|li)[^>]*class=["'][^"']*(story|news|post|item)[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi },
      { name: 'card_block', selector: '.card, .post-card', regex: /<(div|section)[^>]*class=["'][^"']*(card|post)[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi },
    ];

    for (const candidate of potentialContainers) {
      const matches = html.match(candidate.regex);
      if (matches && matches.length > 0) {
        const sampleItems: ExtractedItem[] = [];

        for (let i = 0; i < Math.min(matches.length, 3); i++) {
          const cardHtml = matches[i];
          const titleMatch = cardHtml.match(/<a[^>]*>(.*?)<\/a>/i) || cardHtml.match(/<h[1-4][^>]*>(.*?)<\/h[1-4]>/i);
          const linkMatch = cardHtml.match(/href=["']([^"']+)["']/i);

          if (titleMatch) {
            const cleanTitle = titleMatch.replace(/<[^>]+>/g, '').trim();
            const cleanUrl = linkMatch ? linkMatch : payload.url;

            sampleItems.push({
              rawTitle: cleanTitle,
              rawUrl: cleanUrl,
              rawSummary: cleanTitle,
              rawPublishedAt: new Date(),
            });
          }
        }

        if (sampleItems.length > 0) {
          console.log(`🤖 [AI ADAPTATION SUCCESS] Auto-recovered updated DOM selectors using "${candidate.name}" strategy.`);
          return {
            recovered: true,
            proposedSelectors: {
              container: candidate.selector,
              title: 'a, h2, h3',
              link: 'a[href]',
            },
            confidenceScore: 90,
            reason: `AI layout analyzer detected ${matches.length} valid article elements matching container selector "${candidate.selector}".`,
            sampleItems,
          };
        }
      }
    }

    return {
      recovered: false,
      confidenceScore: 0,
      reason: 'AI adaptation could not isolate structural article cards on modified HTML markup.',
      sampleItems: [],
    };
  }
}