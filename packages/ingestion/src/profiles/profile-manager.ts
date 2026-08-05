import { PrismaClient } from '@prisma/client';
import { MonitoringPlan, SourceProfile } from '../types';

export class ProfileManager {
  constructor(private prisma: PrismaClient) {}

  public async saveProfile(sourceId: string, plan: MonitoringPlan): Promise<SourceProfile> {
    const profile = await this.prisma.sourceProfile.upsert({
      where: { sourceId },
      update: {
        monitoringStrategy: plan.detectedType,
        extractorPlugin: plan.extractorPlugin,
        confidenceScore: plan.confidenceScore,
        recommendedIntervalSec: plan.recommendedIntervalSec,
        metadataCapabilities: plan.metadataSupported,
      },
      create: {
        sourceId,
        monitoringStrategy: plan.detectedType,
        extractorPlugin: plan.extractorPlugin,
        confidenceScore: plan.confidenceScore,
        recommendedIntervalSec: plan.recommendedIntervalSec,
        healthScore: 100,
        consecutiveFailures: 0,
        metadataCapabilities: plan.metadataSupported,
      },
    });

    return {
      id: profile.id,
      sourceId: profile.sourceId,
      monitoringStrategy: profile.monitoringStrategy as any,
      extractorPlugin: profile.extractorPlugin,
      confidenceScore: profile.confidenceScore,
      recommendedIntervalSec: profile.recommendedIntervalSec,
      healthScore: profile.healthScore,
      consecutiveFailures: profile.consecutiveFailures,
      metadataCapabilities: profile.metadataCapabilities as string[],
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  public async getProfile(sourceId: string): Promise<SourceProfile | null> {
    const profile = await this.prisma.sourceProfile.findUnique({
      where: { sourceId },
    });

    if (!profile) return null;

    return {
      id: profile.id,
      sourceId: profile.sourceId,
      monitoringStrategy: profile.monitoringStrategy as any,
      extractorPlugin: profile.extractorPlugin,
      confidenceScore: profile.confidenceScore,
      recommendedIntervalSec: profile.recommendedIntervalSec,
      healthScore: profile.healthScore,
      consecutiveFailures: profile.consecutiveFailures,
      metadataCapabilities: profile.metadataCapabilities as string[],
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  public async updateHealth(sourceId: string, isSuccess: boolean): Promise<void> {
    const profile = await this.prisma.sourceProfile.findUnique({ where: { sourceId } });
    if (!profile) return;

    if (isSuccess) {
      await this.prisma.sourceProfile.update({
        where: { sourceId },
        data: {
          consecutiveFailures: 0,
          healthScore: Math.min(100, profile.healthScore + 5),
        },
      });
    } else {
      const failures = profile.consecutiveFailures + 1;
      const penalty = failures * 10;
      await this.prisma.sourceProfile.update({
        where: { sourceId },
        data: {
          consecutiveFailures: failures,
          healthScore: Math.max(0, profile.healthScore - penalty),
        },
      });
    }
  }
}