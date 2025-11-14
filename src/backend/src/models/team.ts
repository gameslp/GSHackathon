import { prisma } from '../lib/prisma';

export interface CreateTeamData {
  name: string;
  hackathonId: number;
}

export interface UpdateTeamData {
  name?: string;
}

export class TeamModel {
  static async create(data: CreateTeamData) {
    return await prisma.team.create({
      data,
      include: {
        hackathon: true,
        members: true,
        invitations: true,
      },
    });
  }

  static async findById(id: number) {
    return await prisma.team.findUnique({
      where: { id },
      include: {
        hackathon: true,
        members: true,
        invitations: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  static async findAll() {
    return await prisma.team.findMany({
      include: {
        hackathon: true,
        members: true,
        invitations: true,
      },
    });
  }

  static async findByHackathon(hackathonId: number) {
    return await prisma.team.findMany({
      where: { hackathonId },
      include: {
        members: true,
        invitations: true,
      },
    });
  }

  static async update(id: number, data: UpdateTeamData) {
    return await prisma.team.update({
      where: { id },
      data,
      include: {
        hackathon: true,
        members: true,
        invitations: true,
      },
    });
  }

  static async delete(id: number) {
    return await prisma.team.delete({
      where: { id },
    });
  }

  static async addMember(teamId: number, userId: number) {
    return await prisma.team.update({
      where: { id: teamId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: {
        members: true,
      },
    });
  }

  static async removeMember(teamId: number, userId: number) {
    return await prisma.team.update({
      where: { id: teamId },
      data: {
        members: {
          disconnect: { id: userId },
        },
      },
      include: {
        members: true,
      },
    });
  }

  static async getTeamSize(teamId: number) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
      },
    });
    return team?.members.length || 0;
  }

  static async isTeamFull(teamId: number) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        hackathon: true,
        members: true,
      },
    });

    if (!team) return false;

    return team.members.length >= team.hackathon.teamMax;
  }

  static async canAddMember(teamId: number) {
    return !(await this.isTeamFull(teamId));
  }
}