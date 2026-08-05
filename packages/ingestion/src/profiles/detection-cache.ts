import { MonitoringPlan } from '../types';

export class DetectionCache {
  private static cache = new Map<string, { plan: MonitoringPlan; expiresAt: number }>();
  private static TTL_MS = 24 * 60 * 60 * 1000; // 24 hours cache TTL

  public static get(url: string): MonitoringPlan | null {
    const entry = this.cache.get(url);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(url);
      return null;
    }

    return entry.plan;
  }

  public static set(url: string, plan: MonitoringPlan): void {
    this.cache.set(url, {
      plan,
      expiresAt: Date.now() + this.TTL_MS,
    });
  }

  public static clear(): void {
    this.cache.clear();
  }
}