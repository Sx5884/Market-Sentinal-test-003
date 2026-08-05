import { ExtractorPlugin, SourceProfile, DownloadedPayload, ExtractedItem } from '../../types';

export class HtmlPlugin implements ExtractorPlugin {
  public readonly name = 'HtmlPlugin';

  public canHandle(profile: SourceProfile): boolean {
    return profile.monitoringStrategy === 'html_listing' || 
           profile.monitoringStrategy === 'generic_html' || 
           profile.extractorPlugin === 'HtmlCardPlugin' ||
           profile.extractorPlugin === 'HtmlPlugin';
  }

  public async extract(payload: DownloadedPayload, profile: SourceProfile): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];
    const html = payload.body;

    // Extract Title
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch.replace(/<[^>]+>/g, '').trim() : '';

    // Extract Description Snippet
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i) ||
                          html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/i);
    let snippet = metaDescMatch ? metaDescMatch.replace(/<[^>]+>/g, '').trim() : '';

    if (!snippet) {
      const pMatch = html.match(/<p[^>]*>(.*?)<\/p>/gi);
      if (pMatch && pMatch.length > 0) {
        snippet = pMatch[0].replace(/<[^>]+>/g, '').trim().substring(0, 250);
      }
    }

    items.push({
      rawTitle: title,
      rawUrl: payload.url,
      rawSummary: snippet,
      rawContent: html,
      rawPublishedAt: new Date(),
    });

    return items;
  }
}