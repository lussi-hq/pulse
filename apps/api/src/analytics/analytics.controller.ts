import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('api')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('analytics')
  async getAnalytics() {
    return this.analyticsService.getAnalytics();
  }

  @Get('deployments')
  async getDeployments() {
    return this.analyticsService.getDeployments();
  }
}
