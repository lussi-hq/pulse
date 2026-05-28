import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';

@Module({
  imports: [],
  controllers: [AnalyticsController],
  providers: [PrismaService, AnalyticsService],
})
export class AppModule {}
