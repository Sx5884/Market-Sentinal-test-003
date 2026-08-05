import crypto from 'crypto';

export class Hasher {
  /**
   * Generates a 64-character SHA-256 hash based on stable article identity
   * (title + canonical URL) rather than volatile raw HTML markup.
   */
  public static generateContentHash(title: string, url: string): string {
    const cleanTitle = title.toLowerCase().replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const cleanUrl = url.toLowerCase().trim();
    const input = `${cleanTitle}-${cleanUrl}`;
    
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}