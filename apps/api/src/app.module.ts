import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { AuthController } from './auth/auth.controller';

@Module({
  imports: [],
  controllers: [AnalyticsController, AuthController],
  providers: [PrismaService, AnalyticsService],
})
export class AppModule {}

