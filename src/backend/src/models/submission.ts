import { SubmissionFileInclude, SubmissionInclude } from 'src/generated/prisma/models';
import { prisma } from '../lib/prisma';
import { Prisma, Submission } from '@prisma/client';

export class SubmissionModel {
  static async create(data: Prisma.SubmissionUncheckedCreateInput) {
    return await prisma.submission.create({
      data,
    });
  }

  static async findById(id: number, includeFiles: boolean = false) {
    return await prisma.submission.findUnique({
      where: { id },
      include: {
        files: includeFiles,
      },
    });
  }

  static async isSend(id: number) {
    const submission = await prisma.submission.findUnique({
      where: { id },
      select: {
        sendAt: true,
      },
    });
    return submission?.sendAt !== null;
  }

  static async findByTeam(teamId: number) {
    return await prisma.submission.findMany({
      where: { teamId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async findByHackathon(hackathonId: number) {
    return await prisma.submission.findMany({
      where: { hackathonId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async findByTeamAndHackathon(teamId: number, hackathonId: number) {
    return await prisma.submission.findFirst({
      where: {
        teamId,
        hackathonId,
      },
    });
  }

  static async isTeamSubmissionOwner(submissionId: number, teamId: number) {
    return prisma.submission.count({
      where: {
        id: submissionId,
        teamId,
      },
    }).then(count => count > 0);
  }

  static async update(id: number, data: Prisma.SubmissionUncheckedUpdateInput) {
    return await prisma.submission.update({
      where: { id },
      data,
    });
  }

  static async delete(id: number) {
    return await prisma.submission.delete({
      where: { id },
    });
  }

  static async findByIdWithFiles(id: number) {
    return await prisma.submission.findUnique({
      where: { id },
      include: {
        files: {
          include: {
            fileFormat: true,
          }
        }
      },
    });
  }

  static async updateScoreComment(submissionId: number, scoreComment: string, scoreId: number, scoreManual: boolean = false) {
    return await prisma.submission.update({
      where: { id: submissionId },
      data: {
        scoreComment,
        scoreId,
        scoreManual,
        scoredAt: new Date(),
      },
    });
  }

  //  static async updateScore(submissionId: number, score: number, scoreManual: boolean = false) {
  //   return await prisma.submission.update({
  //     where: { id: submissionId },
  //     data: {
  //       score,
  //       scoreManual,
  //     },
  //   });
  // }
}
