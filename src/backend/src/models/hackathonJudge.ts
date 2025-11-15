import { prisma } from '../lib/prisma';

export class HackathonJudgeModel {
  static async assign(hackathonId: number, judgeId: number) {
    return prisma.hackathonJudge.create({
      data: { hackathonId, judgeId },
      include: {
        judge: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            email: true,
          },
        },
      },
    });
  }

  static async remove(hackathonId: number, judgeId: number) {
    return prisma.hackathonJudge.delete({
      where: {
        hackathonId_judgeId: {
          hackathonId,
          judgeId,
        },
      },
    });
  }

  static async isJudgeAssigned(hackathonId: number, judgeId: number) {
    const assignment = await prisma.hackathonJudge.findUnique({
      where: {
        hackathonId_judgeId: {
          hackathonId,
          judgeId,
        },
      },
      select: {
        id: true,
      },
    });

    return Boolean(assignment);
  }

  static async findByHackathon(hackathonId: number) {
    return prisma.hackathonJudge.findMany({
      where: { hackathonId },
      include: {
        judge: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  static async findHackathonsByJudge(judgeId: number) {
    return prisma.hackathon.findMany({
      where: {
        judgeAssignments: {
          some: { judgeId },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }
}
