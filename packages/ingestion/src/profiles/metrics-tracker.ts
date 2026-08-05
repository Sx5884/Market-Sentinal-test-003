import { PrismaClient } from '@prisma/client';

export class MetricsTracker {
  constructor(private prisma: PrismaClient) {}

  public async recordFetchLog(
    sourceId: string,
    status: 'success' | 'failure',
    itemCount: number,
    durationMs: number,
    error?: string
  ): Promise<void> {
    await this.prisma.fetchLog.create({
      data: {
        sourceId,
        status,
        itemCount,
        durationMs,
        error,
      },
    });
  }
}