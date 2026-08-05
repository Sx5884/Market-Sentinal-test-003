import { ExtractorPlugin, SourceProfile, DownloadedPayload, ExtractedItem } from '../../types';

export class RssPlugin implements ExtractorPlugin {
  public readonly name = 'RssPlugin';

  public canHandle(profile: SourceProfile): boolean {
    return profile.monitoringStrategy === 'rss' || profile.extractorPlugin === 'RssPlugin';
  }

  public async extract(payload: DownloadedPayload, profile: SourceProfile): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];
    const xml = payload.body;

    const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];

    for (const match of itemMatches) {
      const titleMatch = match.match(/<title[^>]*>(.*?)<\/title>/i);
      const linkMatch = match.match(/<link[^>]*>(.*?)<\/link>/i) || match.match(/<link[^>]*href=["'](.*?)["']/i);
      const pubDateMatch = match.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i) || match.match(/<updated[^>]*>(.*?)<\/updated>/i) || match.match(/<dc:date[^>]*>(.*?)<\/dc:date>/i);
      const descMatch = match.match(/<description[^>]*>(.*?)<\/description>/i) || match.match(/<summary[^>]*>(.*?)<\/summary>/i);
      const authorMatch = match.match(/<author[^>]*>(.*?)<\/author>/i) || match.match(/<dc:creator[^>]*>(.*?)<\/dc:creator>/i);

      const title = titleMatch ? this.cleanCdata(titleMatch) : '';
      const url = linkMatch ? this.cleanCdata(linkMatch) : payload.url;
      const pubDate = pubDateMatch ? pubDateMatch.trim() : undefined;
      const summary = descMatch ? this.cleanCdata(descMatch) : '';
      const author = authorMatch ? this.cleanCdata(authorMatch) : undefined;

      if (title || url) {
        items.push({
          rawTitle: title,
          rawUrl: url,
          rawPublishedAt: pubDate,
          rawSummary: summary,
          rawContent: summary,
          rawAuthor: author,
        });
      }
    }

    return items;
  }

  private cleanCdata(text: string): string {
    return text.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
  }
}