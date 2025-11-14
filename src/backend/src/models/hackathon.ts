import { prisma } from '../lib/prisma';

export interface CreateHackathonData {
  title: string;
  description: string;
  organizerId: number;
  teamMax: number;
  teamMin: number;
  registrationOpen: Date;
  startDate: Date;
  endDate: Date;
}

export interface UpdateHackathonData {
  title?: string;
  description?: string;
  teamMax?: number;
  teamMin?: number;
  registrationOpen?: Date;
  startDate?: Date;
  endDate?: Date;
}

export class HackathonModel {
  static async create(data: CreateHackathonData) {
    return await prisma.hackathon.create({
      data,
      include: {
        organizer: true,
        teams: true,
        resources: true,
      },
    });
  }

  static async findById(id: number) {
    return await prisma.hackathon.findUnique({
      where: { id },
      include: {
        organizer: true,
        teams: {
          include: {
            members: true,
          },
        },
        resources: true,
      },
    });
  }

  static async findAll() {
    return await prisma.hackathon.findMany({
      include: {
        organizer: true,
        teams: true,
        resources: true,
      },
    });
  }

  static async findByOrganizer(organizerId: number) {
    return await prisma.hackathon.findMany({
      where: { organizerId },
      include: {
        teams: true,
        resources: true,
      },
    });
  }

  static async update(id: number, data: UpdateHackathonData) {
    return await prisma.hackathon.update({
      where: { id },
      data,
      include: {
        organizer: true,
        teams: true,
        resources: true,
      },
    });
  }

  static async delete(id: number) {
    return await prisma.hackathon.delete({
      where: { id },
    });
  }

  static async findActive() {
    const now = new Date();
    return await prisma.hackathon.findMany({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        organizer: true,
        teams: true,
        resources: true,
      },
    });
  }

  static async findUpcoming() {
    const now = new Date();
    return await prisma.hackathon.findMany({
      where: {
        startDate: { gt: now },
      },
      include: {
        organizer: true,
        resources: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  }
}
