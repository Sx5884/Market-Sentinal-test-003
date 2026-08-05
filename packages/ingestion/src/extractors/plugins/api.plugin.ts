import { ExtractorPlugin, SourceProfile, DownloadedPayload, ExtractedItem } from '../../types';

export class ApiPlugin implements ExtractorPlugin {
  public readonly name = 'ApiPlugin';

  public canHandle(profile: SourceProfile): boolean {
    return profile.monitoringStrategy === 'api' || profile.extractorPlugin === 'ApiPlugin';
  }

  public async extract(payload: DownloadedPayload, profile: SourceProfile): Promise<ExtractedItem[]> {
    const items: ExtractedItem[] = [];

    try {
      const json = JSON.parse(payload.body);
      const records = Array.isArray(json) ? json : json.items || json.articles || json.data || json.posts || [];

      if (Array.isArray(records)) {
        for (const record of records) {
          items.push({
            rawTitle: record.title || record.name || record.headline || '',
            rawUrl: record.url || record.link || payload.url,
            rawPublishedAt: record.publishedAt || record.created_at || record.date,
            rawSummary: record.summary || record.description || record.body || '',
            rawContent: record.content || record.text || JSON.stringify(record),
            rawAuthor: record.author || record.creator,
            metadata: record,
          });
        }
      }
    } catch {
      console.error(`⚠️ [ApiPlugin Error] Failed to parse JSON payload for ${payload.url}`);
    }

    return items;
  }
}