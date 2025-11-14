import { prisma } from '../lib/prisma';

export interface CreateSubmissionFileData {
  hackathonId: number;
  description: string;
  extension: string;
  maxSizeKB: number;
}

export interface UpdateSubmissionFileData {
  description?: string;
  extension?: string;
  maxSizeKB?: number;
}

export class SubmissionFileModel {
  static async create(data: CreateSubmissionFileData) {
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

  static async update(id: number, data: UpdateSubmissionFileData) {
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
    hackathonId: number,
    fileName: string,
    fileSizeKB: number
  ): Promise<{ valid: boolean; errors: string[] }> {
    const requirements = await this.findByHackathon(hackathonId);
    const errors: string[] = [];

    if (requirements.length === 0) {
      return { valid: true, errors: [] };
    }

    // Get file extension
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    // Check if any requirement matches
    const matchingRequirement = requirements.find(req =>
      req.extension.toLowerCase() === fileExtension
    );

    if (!matchingRequirement) {
      const allowedExtensions = requirements.map(r => r.extension).join(', ');
      errors.push(`File extension ${fileExtension} not allowed. Allowed extensions: ${allowedExtensions}`);
    } else {
      // Check file size
      if (fileSizeKB > matchingRequirement.maxSizeKB) {
        errors.push(
          `File size ${fileSizeKB}KB exceeds maximum allowed size of ${matchingRequirement.maxSizeKB}KB for ${fileExtension} files`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
