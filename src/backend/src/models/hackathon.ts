import { prisma } from '../lib/prisma';
import { HackathonType } from '../generated/prisma/enums';

export interface CreateHackathonData {
  title: string;
  description: string;
  rules: string;
  type: HackathonType;
  prize: number;
  organizerId: number;
  teamMax: number;
  teamMin: number;
  registrationOpen: Date;
  registrationClose: Date;
  startDate: Date;
  endDate: Date;
  threadLimit?: number | null;
  ramLimit?: number | null;
  submissionTimeout?: number | null;
  submissionLimit?: number | null;
}

export interface UpdateHackathonData {
  title?: string;
  description?: string;
  rules?: string;
  type?: HackathonType;
  prize?: number;
  teamMax?: number;
  teamMin?: number;
  registrationOpen?: Date;
  registrationClose?: Date;
  startDate?: Date;
  endDate?: Date;
  threadLimit?: number | null;
  ramLimit?: number | null;
  submissionTimeout?: number | null;
  submissionLimit?: number | null;
}

export class HackathonModel {
  static async create(data: CreateHackathonData) {
    return await prisma.hackathon.create({
      data: {
        title: data.title,
        description: data.description,
        rules: data.rules,
        type: data.type,
        prize: data.prize,
        teamMax: data.teamMax,
        teamMin: data.teamMin,
        registrationOpen: data.registrationOpen,
        registrationClose: data.registrationClose,
        startDate: data.startDate,
        endDate: data.endDate,
        threadLimit: data.threadLimit ?? null,
        ramLimit: data.ramLimit ?? null,
        submissionTimeout: data.submissionTimeout ?? null,
        submissionLimit: data.submissionLimit ?? null,
        organizer: {
          connect: { id: data.organizerId },
        },
      },
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
