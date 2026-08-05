import { HealthMetrics } from './health-monitor';

export class AdaptivePolling {
  /**
   * Recommends optimal polling interval based on source activity, health score, and failure rates.
   */
  public static calculateRecommendation(
    currentIntervalSec: number,
    averageDailyEvents: number,
    metrics: HealthMetrics
  ): number {
    // 1. Backoff for unhealthy or failing sources
    if (metrics.status === 'CRITICAL') {
      return Math.max(currentIntervalSec, 1800); // Backoff to 30 mins
    }
    if (metrics.status === 'DEGRADED') {
      return Math.max(currentIntervalSec, 900); // Backoff to 15 mins
    }

    // 2. Adaptive interval based on update frequency
    if (averageDailyEvents > 20) {
      return 180; // High activity: 3 minutes
    } else if (averageDailyEvents > 5) {
      return 300; // Moderate activity: 5 minutes
    } else if (averageDailyEvents === 0) {
      return 900; // Low activity: 15 minutes
    }

    return currentIntervalSec;
  }
}