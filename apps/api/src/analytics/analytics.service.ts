import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getAnalytics(monthStr?: string) {
    let year = 2026;
    let month = 4; // May (0-indexed)
    if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
      const parts = monthStr.split('-');
      year = parseInt(parts[0]);
      month = parseInt(parts[1]) - 1;
    } else {
      year = 2026;
      month = 4;
    }

    const startM = new Date(year, month, 1, 0, 0, 0, 0);
    const endM = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const startM1 = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endM1 = new Date(year, month, 0, 23, 59, 59, 999);

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

    // Timeline de l'engagement (dynamic platform lines by date in M)
    const platformsSet = new Set<string>();
    pubsM.forEach(p => platformsSet.add(p.platform));
    const platforms = Array.from(platformsSet);

    const timelineMap: { [dateStr: string]: { date: string; [platform: string]: any } } = {};
    pubsM.forEach(p => {
      p.metrics.forEach(m => {
        const dateStr = m.recordedAt.toISOString().split('T')[0];
        if (!timelineMap[dateStr]) {
          timelineMap[dateStr] = { date: dateStr };
          platforms.forEach(plat => {
            timelineMap[dateStr][plat] = 0;
          });
        }
        timelineMap[dateStr][p.platform] = (timelineMap[dateStr][p.platform] || 0) + m.interactions;
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

    // Performance par Plateforme per Event (Facebook vs LinkedIn / other platforms engagement side-by-side for each distinct event in M)
    // To keep the bar chart simple, we can group interactions by event and platform
    const eventPerformanceMap: { [eventId: string]: { eventName: string; [platform: string]: any } } = {};
    pubsM.forEach(p => {
      const eventId = p.eventId;
      const interactions = p.metrics.reduce((sum, m) => sum + m.interactions, 0);
      if (!eventPerformanceMap[eventId]) {
        eventPerformanceMap[eventId] = { eventName: p.event.name };
        platforms.forEach(plat => {
          eventPerformanceMap[eventId][plat] = 0;
        });
      }
      eventPerformanceMap[eventId][p.platform] = (eventPerformanceMap[eventId][p.platform] || 0) + interactions;
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
      platforms,
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

  async getEvents() {
    return this.prisma.event.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async createEvent(data: { name: string; type: string }) {
    return this.prisma.event.create({
      data: {
        name: data.name,
        type: data.type
      }
    });
  }

  async createPublication(data: {
    eventId: string;
    platform: string;
    publishedAt: string;
    leadTimeDays: number;
    interactions: number;
  }) {
    const publishedAt = new Date(data.publishedAt);
    const publication = await this.prisma.publication.create({
      data: {
        eventId: data.eventId,
        platform: data.platform,
        publishedAt,
        leadTimeDays: Number(data.leadTimeDays)
      }
    });

    await this.prisma.metric.create({
      data: {
        publicationId: publication.id,
        interactions: Number(data.interactions),
        recordedAt: publishedAt
      }
    });

    return publication;
  }

  async updateEvent(id: string, data: { name: string; type: string }) {
    return this.prisma.event.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type
      }
    });
  }

  async deleteEvent(id: string) {
    return this.prisma.event.delete({
      where: { id }
    });
  }

  async updatePublication(id: string, data: {
    eventId: string;
    platform: string;
    publishedAt: string;
    leadTimeDays: number;
    interactions: number;
  }) {
    const publishedAt = new Date(data.publishedAt);
    const publication = await this.prisma.publication.update({
      where: { id },
      data: {
        eventId: data.eventId,
        platform: data.platform,
        publishedAt,
        leadTimeDays: Number(data.leadTimeDays)
      }
    });

    const existingMetric = await this.prisma.metric.findFirst({
      where: { publicationId: id }
    });

    if (existingMetric) {
      await this.prisma.metric.update({
        where: { id: existingMetric.id },
        data: {
          interactions: Number(data.interactions),
          recordedAt: publishedAt
        }
      });
    } else {
      await this.prisma.metric.create({
        data: {
          publicationId: id,
          interactions: Number(data.interactions),
          recordedAt: publishedAt
        }
      });
    }

    return publication;
  }

  async deletePublication(id: string) {
    return this.prisma.publication.delete({
      where: { id }
    });
  }
}
