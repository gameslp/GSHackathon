import { prisma } from '../lib/prisma';

export interface CreateSubmissionFileFormatData {
  name: string;
  hackathonId: number;
  description: string;
  extension: string;
  maxSizeKB: number;
  obligatory?: boolean;
}

export interface UpdateSubmissionFileFormatData {
  name?: string;
  description?: string;
  extension?: string;
  maxSizeKB?: number;
  obligatory?: boolean;
}

export class SubmissionFileFormatModel {
  static async create(data: CreateSubmissionFileFormatData) {
    return await prisma.submissionFile.create({
      data,
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  static async findById(id: number) {
    return await prisma.submissionFile.findUnique({
      where: { id },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  static async findAll() {
    return await prisma.submissionFile.findMany({
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async findByHackathon(hackathonId: number) {
    return await prisma.submissionFile.findMany({
      where: { hackathonId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  static async update(id: number, data: UpdateSubmissionFileFormatData) {
    return await prisma.submissionFile.update({
      where: { id },
      data,
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  static async delete(id: number) {
    return await prisma.submissionFile.delete({
      where: { id },
    });
  }

  static async validateFileSubmission(
    formatId: number,
    fileName: string,
    fileSizeKB: number
  ): Promise<{ valid: boolean; errors: string[] }> {
    const format = await this.findById(formatId);
    const errors: string[] = [];

    if (!format) {
      return { valid: false, errors: ['Format not found'] };
    }

    // Get file extension
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    // Check if extension matches
    if (format.extension.toLowerCase() !== fileExtension) {
      errors.push(`File extension ${fileExtension} does not match required extension ${format.extension}`);
    }

    // Check file size
    if (fileSizeKB > format.maxSizeKB) {
      errors.push(
        `File size ${fileSizeKB}KB exceeds maximum allowed size of ${format.maxSizeKB}KB`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
