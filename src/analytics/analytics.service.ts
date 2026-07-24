import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getLeaderboard(limit = 10, topicId?: string) {
    const whereClause = topicId 
      ? { topicId, status: 'COMPLETED' as const } 
      : { status: 'COMPLETED' as const };
    
    const aggregated = await this.prisma.exam.groupBy({
      by: ['userId'],
      where: whereClause,
      _sum: { score: true, totalMarks: true },
      _count: { id: true },
      orderBy: { _sum: { score: 'desc' } },
      take: limit,
    });

    const userIds = aggregated.map(a => a.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return aggregated.map((a, index) => {
      const user = userMap.get(a.userId);
      const totalScore = a._sum.score || 0;
      const totalMarks = a._sum.totalMarks || 0;
      const avgScore = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;

      return {
        rank: index + 1,
        userId: a.userId,
        userName: user ? `${user.firstName} ${user.lastName}`.trim() : 'Unknown User',
        totalExams: a._count.id,
        avgScore: Number(avgScore.toFixed(2)),
        totalScore,
      };
    });
  }

  async getStudentDashboard(userId: string) {
    const aggregated = await this.prisma.exam.aggregate({
      where: { userId, status: 'COMPLETED' },
      _sum: { score: true, totalMarks: true },
      _count: { id: true },
      _max: { score: true },
    });

    const recentExamsData = await this.prisma.exam.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { topic: { select: { name: true } } },
    });

    const totalScoreAgg = aggregated._sum.score || 0;
    const totalMarksAgg = aggregated._sum.totalMarks || 0;
    const avgPct = totalMarksAgg > 0 ? (totalScoreAgg / totalMarksAgg) * 100 : 0;

    return {
      totalExamsTaken: aggregated._count.id,
      avgPercentage: Number(avgPct.toFixed(2)),
      highestScore: aggregated._max.score || 0,
      recentExams: recentExamsData.map(e => ({
        id: e.id,
        topicName: e.topic?.name || 'Unknown',
        score: e.score,
        totalMarks: e.totalMarks,
        percentage: e.totalMarks > 0 ? Number(((e.score / e.totalMarks) * 100).toFixed(2)) : 0,
        createdAt: e.createdAt,
      })),
    };
  }

  async getAdminOverview() {
    const [totalUsers, totalQuestions, totalExamsTaken] = await this.prisma.$transaction([
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.question.count(),
      this.prisma.exam.count({ where: { status: 'COMPLETED' } }),
    ]);

    const topicAggregations = await this.prisma.exam.groupBy({
      by: ['topicId'],
      where: { status: 'COMPLETED' },
      _sum: { score: true, totalMarks: true },
      _count: { id: true },
    });

    const topTopics = topicAggregations.map(t => {
      const ts = t._sum.score || 0;
      const tm = t._sum.totalMarks || 0;
      const pct = tm > 0 ? (ts / tm) * 100 : 0;
      return { topicId: t.topicId, examsCount: t._count.id, avgPercentage: pct };
    }).sort((a, b) => b.avgPercentage - a.avgPercentage).slice(0, 5);

    const topicIds = topTopics.map(t => t.topicId);
    const topics = await this.prisma.topic.findMany({
      where: { id: { in: topicIds } },
      select: { id: true, name: true },
    });
    const topicMap = new Map(topics.map(t => [t.id, t.name]));

    return {
      totalUsers,
      totalQuestions,
      totalExamsTaken,
      topPerformingTopics: topTopics.map(t => ({
        topicId: t.topicId,
        topicName: topicMap.get(t.topicId) || 'Unknown',
        examsCount: t.examsCount,
        avgPercentage: Number(t.avgPercentage.toFixed(2)),
      })),
    };
  }
}
