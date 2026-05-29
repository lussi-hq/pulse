import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('analytics')
  async getAnalytics(@Query('month') month?: string) {
    return this.analyticsService.getAnalytics(month);
  }

  @Get('deployments')
  async getDeployments() {
    return this.analyticsService.getDeployments();
  }

  @Get('events')
  async getEvents() {
    return this.analyticsService.getEvents();
  }

  @Post('events')
  async createEvent(@Body() data: { name: string; type: string }) {
    return this.analyticsService.createEvent(data);
  }

  @Post('publications')
  async createPublication(
    @Body() data: {
      eventId: string;
      platform: string;
      publishedAt: string;
      leadTimeDays: number;
      interactions: number;
    }
  ) {
    return this.analyticsService.createPublication(data);
  }
}
