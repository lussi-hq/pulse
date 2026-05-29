import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api')
@UseGuards(AuthGuard)
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

  @Put('events/:id')
  async updateEvent(@Param('id') id: string, @Body() data: { name: string; type: string }) {
    return this.analyticsService.updateEvent(id, data);
  }

  @Delete('events/:id')
  async deleteEvent(@Param('id') id: string) {
    return this.analyticsService.deleteEvent(id);
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

  @Put('publications/:id')
  async updatePublication(
    @Param('id') id: string,
    @Body() data: {
      eventId: string;
      platform: string;
      publishedAt: string;
      leadTimeDays: number;
      interactions: number;
    }
  ) {
    return this.analyticsService.updatePublication(id, data);
  }

  @Delete('publications/:id')
  async deletePublication(@Param('id') id: string) {
    return this.analyticsService.deletePublication(id);
  }
}
