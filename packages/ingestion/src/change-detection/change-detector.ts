import { PrismaClient } from '@prisma/client';
import { NormalizedEvent } from '../types';

export interface ChangeDetectionResult {
  newEvents: NormalizedEvent[];
  skippedDuplicatesCount: number;
}

export class ChangeDetector {
  constructor(private prisma: PrismaClient) {}

  public async detectChanges(
    sourceId: string, 
    events: NormalizedEvent[]
  ): Promise<ChangeDetectionResult> {
    const newEvents: NormalizedEvent[] = [];
    let skippedDuplicatesCount = 0;

    for (const event of events) {
      // Query database for existing sourceId + contentHash
      const existing = await this.prisma.event.findFirst({
        where: {
          sourceId,
          contentHash: event.contentHash,
        },
      });

      if (!existing) {
        newEvents.push(event);
      } else {
        skippedDuplicatesCount++;
      }
    }

    return {
      newEvents,
      skippedDuplicatesCount,
    };
  }
}