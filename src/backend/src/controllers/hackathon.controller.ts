import { Request, Response } from 'express';
import { prisma } from '@prisma';
import { HackathonModel } from '../models/hackathon';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { HackathonType } from '../generated/prisma/enums';

// Zod validation schemas
const createHackathonSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  rules: z.string().min(10).max(10000),
  type: z.nativeEnum(HackathonType),
  prize: z.number().int().min(0),
  teamMax: z.number().int().min(1).max(50),
  teamMin: z.number().int().min(1).max(50),
  registrationOpen: z.string().datetime().or(z.date()),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
}).refine(data => data.teamMax >= data.teamMin, {
  message: 'Team maximum must be greater than or equal to team minimum',
  path: ['teamMax'],
}).refine(data => {
  const regOpen = new Date(data.registrationOpen);
  const start = new Date(data.startDate);
  return start > regOpen;
}, {
  message: 'Start date must be after registration open date',
  path: ['startDate'],
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

const updateHackathonSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  rules: z.string().min(10).max(10000).optional(),
  type: z.nativeEnum(HackathonType).optional(),
  prize: z.number().int().min(0).optional(),
  teamMax: z.number().int().min(1).max(50).optional(),
  teamMin: z.number().int().min(1).max(50).optional(),
  registrationOpen: z.string().datetime().or(z.date()).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
}).refine(data => {
  if (data.teamMax !== undefined && data.teamMin !== undefined) {
    return data.teamMax >= data.teamMin;
  }
  return true;
}, {
  message: 'Team maximum must be greater than or equal to team minimum',
  path: ['teamMax'],
});

export const getHackathonTeams = async (req: Request, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    // Check if hackathon exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Get total count for pagination
    const totalTeams = await prisma.team.count({
      where: { hackathonId },
    });

    // Get teams with pagination
    const teams = await prisma.team.findMany({
      where: { hackathonId },
      skip,
      take: limit,
      include: {
        members: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      teams: teams.map(team => ({
        id: team.id,
        name: team.name,
        invitationCode: team.invitationCode,
        captainId: team.captainId,
        isAccepted: team.isAccepted,
        memberCount: team._count.members,
        members: team.members,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total: totalTeams,
        totalPages: Math.ceil(totalTeams / limit),
      },
    });
  } catch (error) {
    console.error('Get hackathon teams error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTeamDetails = async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);

    if (!teamId || isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    // Get team with survey responses
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            email: true,
          },
        },
        hackathon: {
          select: {
            id: true,
            title: true,
            teamMax: true,
            teamMin: true,
          },
        },
        surveyResponses: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                order: true,
              },
            },
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
              },
            },
          },
          orderBy: [
            { userId: 'asc' },
            { question: { order: 'asc' } },
          ],
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Group survey responses by member
    const memberResponses = team.members.map(member => {
      const responses = team.surveyResponses
        .filter(r => r.userId === member.id)
        .map(r => ({
          questionId: r.question.id,
          question: r.question.question,
          answer: r.answer,
          order: r.question.order,
        }))
        .sort((a, b) => a.order - b.order);

      return {
        member: {
          id: member.id,
          username: member.username,
          name: member.name,
          surname: member.surname,
          email: member.email,
        },
        surveyResponses: responses,
      };
    });

    return res.status(200).json({
      team: {
        id: team.id,
        name: team.name,
        invitationCode: team.invitationCode,
        captainId: team.captainId,
        isAccepted: team.isAccepted,
        hackathon: team.hackathon,
        memberResponses,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get team details error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const acceptTeam = async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);

    if (!teamId || isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.isAccepted) {
      return res.status(400).json({ error: 'Team is already accepted' });
    }

    // Accept the team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { isAccepted: true },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
          },
        },
        hackathon: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: 'Team accepted successfully',
      team: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        isAccepted: updatedTeam.isAccepted,
        hackathon: updatedTeam.hackathon,
        members: updatedTeam.members,
        updatedAt: updatedTeam.updatedAt,
      },
    });
  } catch (error) {
    console.error('Accept team error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const rejectTeam = async (req: Request, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);

    if (!teamId || isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Reject the team (set to false)
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { isAccepted: false },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
          },
        },
        hackathon: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: 'Team rejected successfully',
      team: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        isAccepted: updatedTeam.isAccepted,
        hackathon: updatedTeam.hackathon,
        members: updatedTeam.members,
        updatedAt: updatedTeam.updatedAt,
      },
    });
  } catch (error) {
    console.error('Reject team error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all hackathons with pagination
export const getHackathons = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const totalHackathons = await prisma.hackathon.count();
    const hackathons = await HackathonModel.findAll();

    // Apply pagination manually since the model returns all
    const paginatedHackathons = hackathons.slice(skip, skip + limit);

    return res.status(200).json({
      hackathons: paginatedHackathons,
      pagination: {
        page,
        limit,
        total: totalHackathons,
        totalPages: Math.ceil(totalHackathons / limit),
      },
    });
  } catch (error) {
    console.error('Get hackathons error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single hackathon by ID
export const getHackathonById = async (req: Request, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.id);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    return res.status(200).json(hackathon);
  } catch (error) {
    console.error('Get hackathon by ID error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new hackathon
export const createHackathon = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate request body with Zod
    const validationResult = createHackathonSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const data = validationResult.data;
    const currentUser = req.user;

    const hackathon = await HackathonModel.create({
      title: data.title,
      description: data.description,
      organizerId: currentUser.userId,
      rules: data.rules,
      type: data.type,
      prize: data.prize,
      teamMax: data.teamMax,
      teamMin: data.teamMin,
      registrationOpen: new Date(data.registrationOpen),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });

    return res.status(201).json({
      message: 'Hackathon created successfully',
      hackathon,
    });
  } catch (error) {
    console.error('Create hackathon error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a hackathon
export const updateHackathon = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const hackathonId = parseInt(req.params.id);
    const currentUser = req.user;

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    // Validate request body with Zod
    const validationResult = updateHackathonSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    // Check if hackathon exists
    const existingHackathon = await HackathonModel.findById(hackathonId);

    if (!existingHackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check if user is the organizer or admin
    if (existingHackathon.organizerId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this hackathon' });
    }

    const data = validationResult.data;

    // Prepare update data
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.rules !== undefined) updateData.rules = data.rules;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.prize !== undefined) updateData.prize = data.prize;
    if (data.teamMax !== undefined) updateData.teamMax = data.teamMax;
    if (data.teamMin !== undefined) updateData.teamMin = data.teamMin;
    if (data.registrationOpen !== undefined) updateData.registrationOpen = new Date(data.registrationOpen);
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);

    const hackathon = await HackathonModel.update(hackathonId, updateData);

    return res.status(200).json({
      message: 'Hackathon updated successfully',
      hackathon,
    });
  } catch (error) {
    console.error('Update hackathon error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a hackathon
export const deleteHackathon = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const hackathonId = parseInt(req.params.id);
    const currentUser = req.user;

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    // Check if hackathon exists
    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check if user is the organizer or admin
    if (hackathon.organizerId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this hackathon' });
    }

    await HackathonModel.delete(hackathonId);

    return res.status(200).json({
      message: 'Hackathon deleted successfully',
      deletedHackathonId: hackathonId,
    });
  } catch (error) {
    console.error('Delete hackathon error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get active hackathons (currently running)
export const getActiveHackathons = async (req: Request, res: Response) => {
  try {
    const hackathons = await HackathonModel.findActive();
    return res.status(200).json(hackathons);
  } catch (error) {
    console.error('Get active hackathons error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get upcoming hackathons
export const getUpcomingHackathons = async (req: Request, res: Response) => {
  try {
    const hackathons = await HackathonModel.findUpcoming();
    return res.status(200).json(hackathons);
  } catch (error) {
    console.error('Get upcoming hackathons error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get hackathons by organizer
export const getHackathonsByOrganizer = async (req: Request, res: Response) => {
  try {
    const organizerId = parseInt(req.params.organizerId);

    if (!organizerId || isNaN(organizerId)) {
      return res.status(400).json({ error: 'Invalid organizer ID' });
    }

    const hackathons = await HackathonModel.findByOrganizer(organizerId);
    return res.status(200).json(hackathons);
  } catch (error) {
    console.error('Get hackathons by organizer error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
