// 1. SourceProfile Interface
export interface SourceProfile {
  id: string;
  sourceId: string;
  monitoringStrategy: 'rss' | 'html_listing' | 'api' | 'github' | 'reddit' | 'youtube' | 'generic_html';
  extractorPlugin: string;
  feedUrl?: string;
  selectors?: Record<string, string>;
  confidenceScore: number;
  recommendedIntervalSec: number;
  healthScore: number;
  consecutiveFailures: number;
  metadataCapabilities: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. MonitoringPlan Interface
export interface MonitoringPlan {
  detectedType: 'rss' | 'html_listing' | 'api' | 'github' | 'reddit' | 'youtube' | 'generic_html';
  extractorPlugin: string;
  confidenceScore: number;
  reason: string;
  recommendedIntervalSec: number;
  expectedDailyUpdates: string;
  metadataSupported: string[];
  fallbackStrategy?: string;
  previewItems: NormalizedEvent[];
}

// 3. DownloadedPayload Interface
export interface DownloadedPayload {
  url: string;
  statusCode: number;
  contentType: string;
  headers: Record<string, string>;
  body: string;
  downloadTimeMs: number;
  timestamp: Date;
}

// 4. ExtractedItem Interface
export interface ExtractedItem {
  rawTitle?: string;
  rawUrl?: string;
  rawPublishedAt?: string | Date;
  rawSummary?: string;
  rawContent?: string;
  rawImage?: string;
  rawAuthor?: string;
  metadata?: Record<string, any>;
}

// 5. NormalizedEvent Interface
export interface NormalizedEvent {
  title: string;
  url: string;
  publishedAt: Date;
  summary: string;
  image?: string;
  author?: string;
  category?: string;
  source: string;
  contentHash: string;
  rawContent: string;
  confidence: number;
  fetchTime: Date;
}

// 6. ExtractorPlugin Interface
export interface ExtractorPlugin {
  name: string;
  canHandle(profile: SourceProfile): boolean;
  extract(payload: DownloadedPayload, profile: SourceProfile): Promise<ExtractedItem[]>;
}