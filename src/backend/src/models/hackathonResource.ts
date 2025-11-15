import { prisma } from '../lib/prisma';

export interface CreateHackathonResourceData {
  hackathonId: number;
  title: string;
  url: string;
}

export class HackathonResourceModel {
  static async create(data: CreateHackathonResourceData) {
    return prisma.hackathonResource.create({
      data,
    });
  }

  static async delete(id: number) {
    return prisma.hackathonResource.delete({
      where: { id },
    });
  }

  static async findById(id: number) {
    return prisma.hackathonResource.findUnique({
      where: { id },
    });
  }

  static async findByHackathon(hackathonId: number) {
    return prisma.hackathonResource.findMany({
      where: { hackathonId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
