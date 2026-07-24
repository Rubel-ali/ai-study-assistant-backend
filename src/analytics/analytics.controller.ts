import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('leaderboard')
  @UseGuards(AuthGuard('jwt'))
  async getLeaderboard(
    @Query('limit') limit?: string,
    @Query('topicId') topicId?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getLeaderboard(parsedLimit, topicId);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.STUDENT)
  async getStudentDashboard(@Req() req) {
    const userId = req.user.sub;
    return this.analyticsService.getStudentDashboard(userId);
  }

  @Get('admin-overview')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  async getAdminOverview() {
    return this.analyticsService.getAdminOverview();
  }
}
