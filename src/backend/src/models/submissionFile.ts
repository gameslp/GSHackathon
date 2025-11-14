import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export class SubmissionFileModel {
  static async create(data: Prisma.SubmissionFileUncheckedCreateInput) {
    return await prisma.submissionFile.create({
      data,
    });
  }

  static async createMany(files: Prisma.SubmissionFileUncheckedCreateInput[]) {
    return await prisma.submissionFile.createMany({
      data: files,
    });
  }

  static async findById(id: number) {
    return await prisma.submissionFile.findUnique({
      where: { id },
    });
  }

  static async findBySubmission(submissionId: number) {
    return await prisma.submissionFile.findMany({
      where: { submissionId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  static async update(id: number, data: Prisma.SubmissionFileUncheckedUpdateInput) {
    return await prisma.submissionFile.update({
      where: { id },
      data,
    });
  }

  static async delete(id: number) {
    return await prisma.submissionFile.delete({
      where: { id },
    });
  }

  static async deleteBySubmission(submissionId: number) {
    return await prisma.submissionFile.deleteMany({
      where: { submissionId },
    });
  }
}
