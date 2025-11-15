import { SubmissionFileInclude, SubmissionInclude } from 'src/generated/prisma/models';
import { prisma } from '../lib/prisma';
import { Prisma, Submission } from '@prisma/client';
import { scoringQueue } from './scoringQueue';

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
      include: {
        team: {
          select: {
            id: true,
            name: true,
            invitationCode: true,
          },
        },
      },
    });
  }

  static async findByTeamAndHackathon(teamId: number, hackathonId: number) {
    return await prisma.submission.findFirst({
      where: {
        teamId,
        hackathonId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async findAllByTeamAndHackathon(teamId: number, hackathonId: number) {
    return await prisma.submission.findMany({
      where: {
        teamId,
        hackathonId,
      },
      orderBy: {
        createdAt: 'desc',
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

  static async findDraftByTeamAndHackathon(teamId: number, hackathonId: number) {
    return prisma.submission.findFirst({
      where: {
        teamId,
        hackathonId,
        sendAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async countSubmittedByTeam(teamId: number, hackathonId: number) {
    return prisma.submission.count({
      where: {
        teamId,
        hackathonId,
        sendAt: {
          not: null,
        },
      },
    });
  }

  static async findByIdWithFiles(id: number) {
    return await prisma.submission.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            invitationCode: true,
          },
        },
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

  static async triggerRejudgeScoring(submissionId: number) {
    scoringQueue.addToQueue(submissionId, 1);
  }

  static async triggerAllRejudgeScoringForHackathon(hackathonId: number) {
    const submissions = await this.findByHackathon(hackathonId);
    scoringQueue.clear();
    for(const submission of submissions) {
      scoringQueue.addToQueue(submission.id, 0);
    }
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
