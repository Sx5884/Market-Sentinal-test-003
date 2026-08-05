import { DownloadedPayload } from '../types';
import { DownloaderOptions, DEFAULT_USER_AGENT } from './downloader-types';

export class Downloader {
  private timeoutMs: number;
  private maxRetries: number;
  private userAgent: string;

  constructor(options: DownloaderOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 10000;
    this.maxRetries = options.maxRetries ?? 3;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  }

  public async download(url: string, customHeaders: Record<string, string> = {}): Promise<DownloadedPayload> {
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.maxRetries) {
      attempt++;
      const startTime = Date.now();

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json;q=0.8,*/*;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            ...customHeaders,
          },
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeout);
        const downloadTimeMs = Date.now() - startTime;

        // Check for 429 Rate Limiting
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('retry-after');
          const delayMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : this.getBackoffDelay(attempt);
          console.log(`⚠️ [Downloader HTTP 429] Rate-limited at ${url}. Backing off for ${delayMs}ms (Attempt ${attempt}/${this.maxRetries})`);
          await this.sleep(delayMs);
          continue;
        }

        // Check for transient server errors (500, 502, 503, 504)
        if ([500, 502, 503, 504, 408].includes(response.status)) {
          const delayMs = this.getBackoffDelay(attempt);
          console.log(`⚠️ [Downloader HTTP ${response.status}] Transient error at ${url}. Retrying in ${delayMs}ms (Attempt ${attempt}/${this.maxRetries})`);
          await this.sleep(delayMs);
          continue;
        }

        // Read Body
        const body = await response.text();

        // Convert Response Headers to Record
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((val, key) => {
          responseHeaders[key.toLowerCase()] = val;
        });

        return {
          url,
          statusCode: response.status,
          contentType: response.headers.get('content-type') || 'text/html',
          headers: responseHeaders,
          body,
          downloadTimeMs,
          timestamp: new Date(),
        };

      } catch (err: any) {
        lastError = err;
        const delayMs = this.getBackoffDelay(attempt);

        if (err.name === 'AbortError') {
          console.log(`⚠️ [Downloader Timeout] ${url} timed out after ${this.timeoutMs}ms (Attempt ${attempt}/${this.maxRetries})`);
        } else {
          console.log(`⚠️ [Downloader Network Error] ${url}: ${err.message || err} (Attempt ${attempt}/${this.maxRetries})`);
        }

        if (attempt < this.maxRetries) {
          await this.sleep(delayMs);
        }
      }
    }

    throw new Error(`Downloader failed for ${url} after ${this.maxRetries} attempts. Last error: ${lastError?.message || 'Unknown'}`);
  }

  private getBackoffDelay(attempt: number): number {
    const baseDelay = Math.pow(2, attempt) * 1000;
    const jitter = Math.random() * 500;
    return Math.floor(baseDelay + jitter);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}