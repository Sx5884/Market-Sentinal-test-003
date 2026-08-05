import { ExtractedItem, NormalizedEvent, SourceProfile } from '../types';
import { Hasher } from '../change-detection/hasher';

export class Normalizer {
  public static normalize(
    item: ExtractedItem, 
    sourceName: string, 
    profile: SourceProfile
  ): NormalizedEvent {
    const cleanTitle = this.cleanText(item.rawTitle || 'Untitled Event');
    const url = item.rawUrl || profile.feedUrl || '';
    
    // Normalize Publication Date
    let publishedAt = new Date();
    if (item.rawPublishedAt) {
      const parsedDate = new Date(item.rawPublishedAt);
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate;
      }
    }

    const cleanSummary = this.cleanText(item.rawSummary || item.rawContent || cleanTitle);
    const contentHash = Hasher.generateContentHash(cleanTitle, url);

    return {
      title: cleanTitle.length > 150 ? cleanTitle.substring(0, 150) + '...' : cleanTitle,
      url,
      publishedAt,
      summary: cleanSummary.substring(0, 300),
      image: item.rawImage,
      author: item.rawAuthor ? this.cleanText(item.rawAuthor) : undefined,
      source: sourceName,
      contentHash,
      rawContent: item.rawContent || cleanSummary,
      confidence: profile.confidenceScore || 100,
      fetchTime: new Date(),
    };
  }

  private static cleanText(text: string): string {
    if (!text) return '';
    return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }
}