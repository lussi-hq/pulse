import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAnalytics() {
    // Current date is in May 2026.
    const startM = new Date('2026-05-01T00:00:00.000Z');
    const endM = new Date('2026-05-31T23:59:59.999Z');

    // M-1: Previous Month (April 2026)
    const startM1 = new Date('2026-04-01T00:00:00.000Z');
    const endM1 = new Date('2026-04-30T23:59:59.999Z');

    // Fetch publications for M and M-1
    const pubsM = await this.prisma.publication.findMany({
      where: { publishedAt: { gte: startM, lte: endM } },
      include: { event: true, metrics: true }
    });

    const pubsM1 = await this.prisma.publication.findMany({
      where: { publishedAt: { gte: startM1, lte: endM1 } },
      include: { event: true, metrics: true }
    });

    // Calculations for M
    const totalPubsM = pubsM.length;
    const totalEngagementM = pubsM.reduce((sum, p) => sum + p.metrics.reduce((acc, m) => acc + m.interactions, 0), 0);
    const avgLeadTimeM = totalPubsM > 0 
      ? parseFloat((pubsM.reduce((sum, p) => sum + p.leadTimeDays, 0) / totalPubsM).toFixed(1))
      : 0;

    // Calculations for M-1
    const totalPubsM1 = pubsM1.length;
    const totalEngagementM1 = pubsM1.reduce((sum, p) => sum + p.metrics.reduce((acc, m) => acc + m.interactions, 0), 0);
    const avgLeadTimeM1 = totalPubsM1 > 0 
      ? parseFloat((pubsM1.reduce((sum, p) => sum + p.leadTimeDays, 0) / totalPubsM1).toFixed(1))
      : 0;

    // Delta calculations
    const calcDelta = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    const deltaPubs = calcDelta(totalPubsM, totalPubsM1);
    const deltaEngagement = calcDelta(totalEngagementM, totalEngagementM1);
    const deltaLeadTime = calcDelta(avgLeadTimeM, avgLeadTimeM1);

    // Top Performing Content (Campaign + platform with highest total interactions in M)
    let topContent = { name: 'Aucun', platform: '-', interactions: 0 };
    pubsM.forEach(p => {
      const interactions = p.metrics.reduce((sum, m) => sum + m.interactions, 0);
      if (interactions > topContent.interactions) {
        topContent = {
          name: p.event.name,
          platform: p.platform,
          interactions
        };
      }
    });

    // Timeline de l'engagement (LinkedIn vs Facebook by date in M)
    const timelineMap: { [dateStr: string]: { date: string; LinkedIn: number; Facebook: number } } = {};
    pubsM.forEach(p => {
      p.metrics.forEach(m => {
        const dateStr = m.recordedAt.toISOString().split('T')[0];
        if (!timelineMap[dateStr]) {
          timelineMap[dateStr] = { date: dateStr, LinkedIn: 0, Facebook: 0 };
        }
        if (p.platform === 'LinkedIn') {
          timelineMap[dateStr].LinkedIn += m.interactions;
        } else if (p.platform === 'Facebook') {
          timelineMap[dateStr].Facebook += m.interactions;
        }
      });
    });
    const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    // Répartition par Canal (total interactions per platform in M)
    const channelMap: { [platform: string]: number } = {};
    pubsM.forEach(p => {
      const interactions = p.metrics.reduce((sum, m) => sum + m.interactions, 0);
      channelMap[p.platform] = (channelMap[p.platform] || 0) + interactions;
    });
    const channelDistribution = Object.entries(channelMap).map(([name, value]) => ({ name, value }));

    // Performance par Plateforme per Event (Facebook vs LinkedIn engagement side-by-side for each distinct event in M)
    const eventPerformanceMap: { [eventId: string]: { eventName: string; LinkedIn: number; Facebook: number } } = {};
    pubsM.forEach(p => {
      const eventId = p.eventId;
      const interactions = p.metrics.reduce((sum, m) => sum + m.interactions, 0);
      if (!eventPerformanceMap[eventId]) {
        eventPerformanceMap[eventId] = { eventName: p.event.name, LinkedIn: 0, Facebook: 0 };
      }
      if (p.platform === 'LinkedIn') {
        eventPerformanceMap[eventId].LinkedIn += interactions;
      } else if (p.platform === 'Facebook') {
        eventPerformanceMap[eventId].Facebook += interactions;
      }
    });
    const platformPerformance = Object.values(eventPerformanceMap);

    // Répartition de l'impact global (Total interactions per event in M)
    const eventImpactMap: { [eventName: string]: number } = {};
    pubsM.forEach(p => {
      const interactions = p.metrics.reduce((sum, m) => sum + m.interactions, 0);
      eventImpactMap[p.event.name] = (eventImpactMap[p.event.name] || 0) + interactions;
    });
    const globalImpactDistribution = Object.entries(eventImpactMap).map(([eventName, value]) => ({ eventName, value }));

    return {
      kpis: {
        totalPublications: { value: totalPubsM, delta: deltaPubs },
        globalEngagement: { value: totalEngagementM, delta: deltaEngagement },
        avgLeadTime: { value: avgLeadTimeM, delta: deltaLeadTime },
        topContent
      },
      timeline,
      channelDistribution,
      platformPerformance,
      globalImpactDistribution
    };
  }

  async getDeployments() {
    const publications = await this.prisma.publication.findMany({
      include: {
        event: true,
        metrics: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    return publications.map(p => {
      const totalInteractions = p.metrics.reduce((sum, m) => sum + m.interactions, 0);
      return {
        id: p.id,
        activityName: p.event.name,
        type: p.event.type,
        platform: p.platform,
        publishedAt: p.publishedAt,
        leadTimeDays: p.leadTimeDays,
        interactions: totalInteractions
      };
    });
  }
}
