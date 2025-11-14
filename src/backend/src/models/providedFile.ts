import { prisma } from '../lib/prisma';

export interface CreateProvidedFileData {
  hackathonId: number;
  title: string;
  fileUrl: string;
  public?: boolean;
}

export interface UpdateProvidedFileData {
  title?: string;
  fileUrl?: string;
  public?: boolean;
}

export class ProvidedFileModel {
  static async create(data: CreateProvidedFileData) {
    return await prisma.providedFile.create({
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
    return await prisma.providedFile.findUnique({
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
    return await prisma.providedFile.findMany({
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
    return await prisma.providedFile.findMany({
      where: { hackathonId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  static async findPublicByHackathon(hackathonId: number) {
    return await prisma.providedFile.findMany({
      where: {
        hackathonId,
        public: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  static async update(id: number, data: UpdateProvidedFileData) {
    return await prisma.providedFile.update({
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
    return await prisma.providedFile.delete({
      where: { id },
    });
  }

  static async togglePublic(id: number) {
    const file = await prisma.providedFile.findUnique({
      where: { id },
      select: { public: true },
    });

    if (!file) {
      throw new Error('Provided file not found');
    }

    return await prisma.providedFile.update({
      where: { id },
      data: { public: !file.public },
    });
  }
}
