import { Request, Response } from 'express';
import { prisma } from '@prisma';

/**
 * Get platform statistics
 * Returns overall platform metrics including active challenges, users, prize pool, and daily submissions
 */
export const getPlatformStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    // Helper function to calculate percentage trend
    const calculateTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // 1. Active Challenges - hackathons where start <= NOW <= end
    const [activeChallenges, activeChallengesLastMonth] = await Promise.all([
      prisma.hackathon.count({
        where: {
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
      prisma.hackathon.count({
        where: {
          startDate: { lte: monthAgo },
          endDate: { gte: monthAgo },
        },
      }),
    ]);

    // 2. Data Scientists - all registered users
    const [dataScientists, dataScientistsLastMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: { lt: monthAgo },
        },
      }),
    ]);

    // 3. Total Prize Pool - sum of prizes from active and upcoming hackathons
    const [totalPrizePoolResult, totalPrizePoolLastMonthResult] = await Promise.all([
      prisma.hackathon.aggregate({
        where: {
          endDate: { gte: now }, // Include both active and upcoming hackathons
        },
        _sum: {
          prize: true,
        },
      }),
      prisma.hackathon.aggregate({
        where: {
          endDate: { gte: monthAgo },
        },
        _sum: {
          prize: true,
        },
      }),
    ]);

    const totalPrizePool = totalPrizePoolResult._sum.prize || 0;
    const totalPrizePoolLastMonth = totalPrizePoolLastMonthResult._sum.prize || 0;

    // 4. Submissions Today - count of submissions created today
    const [submissionsToday, submissionsYesterday] = await Promise.all([
      prisma.submission.count({
        where: {
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.submission.count({
        where: {
          createdAt: {
            gte: startOfYesterday,
            lt: startOfToday,
          },
        },
      }),
    ]);

    // Build response
    const stats = {
      activeChallenges: {
        value: activeChallenges,
        trend: calculateTrend(activeChallenges, activeChallengesLastMonth),
      },
      dataScientists: {
        value: dataScientists,
        trend: calculateTrend(dataScientists, dataScientistsLastMonth),
      },
      totalPrizePool: {
        value: totalPrizePool,
        trend: calculateTrend(totalPrizePool, totalPrizePoolLastMonth),
      },
      submissionsToday: {
        value: submissionsToday,
        trend: calculateTrend(submissionsToday, submissionsYesterday),
      },
    };

    return res.status(200).json({
      stats,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get platform stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch platform statistics' });
  }
};
