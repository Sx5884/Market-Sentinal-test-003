import { PrismaClient } from '@prisma/client';

export interface HealthMetrics {
  healthScore: number;        // 0 - 100%
  consecutiveFailures: number;
  averageLatencyMs: number;
  extractionQualityScore: number; // 0 - 100%
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

export class HealthMonitor {
  constructor(private prisma: PrismaClient) {}

  public async calculateHealthMetrics(sourceId: string): Promise<HealthMetrics> {
    const profile = await this.prisma.sourceProfile.findUnique({ where: { sourceId } });
    const recentLogs = await this.prisma.fetchLog.findMany({
      where: { sourceId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (!recentLogs || recentLogs.length === 0) {
      return {
        healthScore: profile?.healthScore ?? 100,
        consecutiveFailures: profile?.consecutiveFailures ?? 0,
        averageLatencyMs: 0,
        extractionQualityScore: 100,
        status: 'HEALTHY',
      };
    }

    const successfulLogs = recentLogs.filter(l => l.status === 'success');
    const successRate = (successfulLogs.length / recentLogs.length) * 100;

    // Calculate Average Latency
    const totalLatency = successfulLogs.reduce((sum, l) => sum + l.durationMs, 0);
    const averageLatencyMs = successfulLogs.length > 0 ? Math.round(totalLatency / successfulLogs.length) : 0;

    // Calculate Extraction Quality Score (% of fetches yielding valid items)
    const itemsFetchedLogs = successfulLogs.filter(l => l.itemCount > 0);
    const extractionQualityScore = successfulLogs.length > 0 
      ? Math.round((itemsFetchedLogs.length / successfulLogs.length) * 100) 
      : 0;

    // Penalty deductions for latency > 5s or failures
    let latencyPenalty = averageLatencyMs > 5000 ? 15 : averageLatencyMs > 2000 ? 5 : 0;
    let consecutiveFailures = profile?.consecutiveFailures ?? 0;
    let failurePenalty = consecutiveFailures * 15;

    const healthScore = Math.max(0, Math.min(100, Math.round(successRate - latencyPenalty - failurePenalty)));

    let status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    if (healthScore < 40 || consecutiveFailures >= 5) status = 'CRITICAL';
    else if (healthScore < 75 || consecutiveFailures >= 2) status = 'DEGRADED';

    return {
      healthScore,
      consecutiveFailures,
      averageLatencyMs,
      extractionQualityScore,
      status,
    };
  }
}