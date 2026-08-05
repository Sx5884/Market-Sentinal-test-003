export interface DownloaderOptions {
  timeoutMs?: number;        // Default: 10000ms (10 seconds)
  maxRetries?: number;       // Default: 3 attempts
  maxRedirects?: number;     // Default: 5
  userAgent?: string;        // Default: Chrome User-Agent string
  headers?: Record<string, string>;
}

export const DEFAULT_USER_AGENT = 
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 MarketSentinel/3.0';