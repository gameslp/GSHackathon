import { Request, Response } from 'express';
import { prisma } from '@prisma';
import { HackathonModel } from '../models/hackathon';
import { HackathonResourceModel } from '../models/hackathonResource';
import { ProvidedFileModel } from '../models/providedFile';
import { TeamModel } from '../models/team';
import { AuthRequest, JwtPayload } from '../middleware/auth';
import { z } from 'zod';
import { HackathonType } from '../generated/prisma/enums';
import {
  RESOURCE_UPLOAD_DIR,
  PROVIDED_UPLOAD_DIR,
  THUMBNAIL_UPLOAD_DIR,
  buildResourceUrl,
  buildProvidedFileUrl,
  buildThumbnailUrl,
  deleteUploadedFile,
} from '../lib/uploads';
import { HackathonJudgeModel } from '../models/hackathonJudge';

// Zod validation schemas
const nonNegativeInt = z.coerce.number().int().min(0);
const positiveInt = z.coerce.number().int().positive();

const booleanish = z
  .union([z.boolean(), z.string()])
  .transform((value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['true', '1', 'on', 'yes'].includes(value.toLowerCase());
    }
    return false;
  });

const createHackathonSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  rules: z.string().min(10).max(10000),
  type: z.nativeEnum(HackathonType),
  prize: nonNegativeInt,
  teamMax: positiveInt.max(50),
  teamMin: positiveInt.max(50),
  registrationOpen: z.string().datetime().or(z.date()),
  registrationClose: z.string().datetime().or(z.date()),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  threadLimit: positiveInt.max(2048).optional(),
  ramLimit: positiveInt.max(2048).optional(),
  submissionTimeout: positiveInt.optional(),
  submissionLimit: positiveInt.optional(),
}).refine(data => data.teamMax >= data.teamMin, {
  message: 'Team maximum must be greater than or equal to team minimum',
  path: ['teamMax'],
}).refine(data => {
  const regOpen = new Date(data.registrationOpen);
  const regClose = new Date(data.registrationClose);
  return regClose > regOpen;
}, {
  message: 'Registration close must be after registration open date',
  path: ['registrationClose'],
}).refine(data => {
  const regClose = new Date(data.registrationClose);
  const start = new Date(data.startDate);
  return start > regClose;
}, {
  message: 'Start date must be after registration close date',
  path: ['startDate'],
}).refine(data => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

const createProvidedFileSchema = z.object({
  title: z.string().min(1).max(200),
  public: booleanish.optional(),
});

const updateProvidedFileSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  public: booleanish.optional(),
});

const updateHackathonSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  rules: z.string().min(10).max(10000).optional(),
  type: z.nativeEnum(HackathonType).optional(),
  prize: nonNegativeInt.optional(),
  teamMax: positiveInt.max(50).optional(),
  teamMin: positiveInt.max(50).optional(),
  registrationOpen: z.string().datetime().or(z.date()).optional(),
  registrationClose: z.string().datetime().or(z.date()).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  threadLimit: positiveInt.max(2048).optional(),
  ramLimit: positiveInt.max(2048).optional(),
  submissionTimeout: positiveInt.optional(),
  submissionLimit: positiveInt.optional(),
}).refine(data => {
  if (data.teamMax !== undefined && data.teamMin !== undefined) {
    return data.teamMax >= data.teamMin;
  }
  return true;
}, {
  message: 'Team maximum must be greater than or equal to team minimum',
  path: ['teamMax'],
});

const createResourceSchema = z.object({
  title: z.string().min(1).max(200),
});

const assignJudgeSchema = z.object({
  judgeId: z.number().int().positive(),
});

const canManageHackathon = async (
  hackathonId: number,
  user: JwtPayload | undefined,
  organizerId?: number
) => {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (organizerId && organizerId === user.userId) return true;
  if (user.role === 'JUDGE') {
    return HackathonJudgeModel.isJudgeAssigned(hackathonId, user.userId);
  }
  return false;
};

const surveyQuestionSchema = z.object({
  question: z.string().min(5).max(1000),
  order: z.number().int().positive().optional(),
});

const updateSurveyQuestionSchema = z.object({
  question: z.string().min(5).max(1000).optional(),
  order: z.number().int().positive().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export const getHackathonTeams = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const currentUser = req.user;

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    if (!currentUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if hackathon exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: {
        organizerId: true,
      },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const canView = await canManageHackathon(hackathonId, currentUser, hackathon.organizerId);

    if (!canView) {
      return res.status(403).json({ error: 'Not authorized to view teams for this hackathon' });
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

export const getTeamDetails = async (req: AuthRequest, res: Response) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const currentUser = req.user;

    if (!teamId || isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    if (!currentUser) {
      return res.status(401).json({ error: 'Not authenticated' });
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
            organizerId: true,
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

    const canView = await canManageHackathon(team.hackathonId, currentUser, team.hackathon.organizerId);

    if (!canView) {
      return res.status(403).json({ error: 'Not authorized to view this team' });
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

    const { organizerId, ...hackathonInfo } = team.hackathon;

    return res.status(200).json({
      team: {
        id: team.id,
        name: team.name,
        invitationCode: team.invitationCode,
        captainId: team.captainId,
        isAccepted: team.isAccepted,
        hackathon: hackathonInfo,
        members: team.members,
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
      registrationClose: new Date(data.registrationClose),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      threadLimit: data.threadLimit,
      ramLimit: data.ramLimit,
      submissionTimeout: data.submissionTimeout,
      submissionLimit: data.submissionLimit,
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
    if (data.registrationClose !== undefined) updateData.registrationClose = new Date(data.registrationClose);
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.threadLimit !== undefined) updateData.threadLimit = data.threadLimit;
    if (data.ramLimit !== undefined) updateData.ramLimit = data.ramLimit;
    if (data.submissionTimeout !== undefined) updateData.submissionTimeout = data.submissionTimeout;
    if (data.submissionLimit !== undefined) updateData.submissionLimit = data.submissionLimit;

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

// ===== Hackathon Resource Endpoints =====

export const createHackathonResource = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const validationResult = createResourceSchema.safeParse({
      title: req.body.title,
    });

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    if (hackathon.organizerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to modify this hackathon' });
    }

    const resource = await HackathonResourceModel.create({
      hackathonId,
      title: validationResult.data.title,
      url: buildResourceUrl(req.file.filename),
    });

    return res.status(201).json({
      message: 'Resource created successfully',
      resource,
    });
  } catch (error) {
    console.error('Create hackathon resource error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteHackathonResource = async (req: AuthRequest, res: Response) => {
  try {
    const resourceId = parseInt(req.params.resourceId);

    if (!resourceId || isNaN(resourceId)) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const resource = await HackathonResourceModel.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const hackathon = await HackathonModel.findById(resource.hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    if (hackathon.organizerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this resource' });
    }

    await HackathonResourceModel.delete(resourceId);
    await deleteUploadedFile(RESOURCE_UPLOAD_DIR, resource.url);

    return res.status(200).json({
      message: 'Resource deleted successfully',
      resourceId,
    });
  } catch (error) {
    console.error('Delete hackathon resource error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== Judge Assignment Endpoints =====

export const getHackathonJudges = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { id: true },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const judges = await HackathonJudgeModel.findByHackathon(hackathonId);

    return res.status(200).json({ judges });
  } catch (error) {
    console.error('Get hackathon judges error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const assignJudgeToHackathon = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const validationResult = assignJudgeSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { id: true },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const judge = await prisma.user.findUnique({
      where: { id: validationResult.data.judgeId },
      select: { id: true, role: true },
    });

    if (!judge || judge.role !== 'JUDGE') {
      return res.status(400).json({ error: 'User must exist and have the JUDGE role' });
    }

    const alreadyAssigned = await HackathonJudgeModel.isJudgeAssigned(
      hackathonId,
      validationResult.data.judgeId
    );

    if (alreadyAssigned) {
      return res.status(400).json({ error: 'Judge already assigned to this hackathon' });
    }

    const assignment = await HackathonJudgeModel.assign(hackathonId, validationResult.data.judgeId);

    return res.status(201).json({
      message: 'Judge assigned successfully',
      assignment,
    });
  } catch (error) {
    console.error('Assign judge error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeJudgeFromHackathon = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);
    const judgeId = parseInt(req.params.judgeId);

    if (!hackathonId || isNaN(hackathonId) || !judgeId || isNaN(judgeId)) {
      return res.status(400).json({ error: 'Invalid hackathon or judge ID' });
    }

    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { id: true },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const assigned = await HackathonJudgeModel.isJudgeAssigned(hackathonId, judgeId);

    if (!assigned) {
      return res.status(404).json({ error: 'Judge is not assigned to this hackathon' });
    }

    await HackathonJudgeModel.remove(hackathonId, judgeId);

    return res.status(200).json({
      message: 'Judge removed from hackathon',
      judgeId,
    });
  } catch (error) {
    console.error('Remove judge error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getJudgeHackathons = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.user.role !== 'JUDGE') {
      return res.status(403).json({ error: 'Judge access required' });
    }

    const hackathons = await HackathonJudgeModel.findHackathonsByJudge(req.user.userId);

    return res.status(200).json({ hackathons });
  } catch (error) {
    console.error('Get judge hackathons error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateHackathonThumbnail = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    if (hackathon.organizerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update thumbnail' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Thumbnail file is required' });
    }

    if (hackathon.thumbnailUrl) {
      await deleteUploadedFile(THUMBNAIL_UPLOAD_DIR, hackathon.thumbnailUrl);
    }

    const updatedHackathon = await HackathonModel.update(hackathonId, {
      thumbnailUrl: buildThumbnailUrl(req.file.filename),
    });

    return res.status(200).json({
      message: 'Thumbnail updated successfully',
      hackathon: updatedHackathon,
    });
  } catch (error) {
    console.error('Update thumbnail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// ===== Provided Files Endpoints =====

// Get provided files for a hackathon
export const getProvidedFiles = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if hackathon exists
    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check if user is organizer, admin, or participant in the hackathon
    const isOrganizer = req.user.userId === hackathon.organizerId;
    const isAdmin = req.user.role === 'ADMIN';
    const isParticipant = await TeamModel.isUserInHackathon(req.user.userId, hackathonId);

    if (!isOrganizer && !isAdmin && !isParticipant) {
      return res.status(403).json({ error: 'You must be part of an accepted team to view files' });
    }

    const files =
      isOrganizer || isAdmin
        ? await ProvidedFileModel.findByHackathon(hackathonId)
        : await ProvidedFileModel.findPublicByHackathon(hackathonId);

    return res.status(200).json(files);
  } catch (error) {
    console.error('Get provided files error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Create/publish a provided file
export const createProvidedFile = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate request body
    const validationResult = createProvidedFileSchema.safeParse({
      title: req.body.title,
      public: req.body.public,
    });

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Check if hackathon exists
    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check if user is the organizer or admin
    if (hackathon.organizerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to add files to this hackathon' });
    }

    const data = validationResult.data;

    const providedFile = await ProvidedFileModel.create({
      hackathonId,
      title: data.title,
      fileUrl: buildProvidedFileUrl(req.file.filename),
      public: data.public ?? false,
    });

    return res.status(201).json({
      message: 'Provided file created successfully',
      file: providedFile,
    });
  } catch (error) {
    console.error('Create provided file error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a provided file
export const updateProvidedFile = async (req: AuthRequest, res: Response) => {
  try {
    const fileId = parseInt(req.params.fileId);

    if (!fileId || isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate request body
    const validationResult = updateProvidedFileSchema.safeParse({
      title: req.body.title,
      public: req.body.public,
    });

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    // Check if file exists
    const existingFile = await ProvidedFileModel.findById(fileId);

    if (!existingFile) {
      return res.status(404).json({ error: 'Provided file not found' });
    }

    // Get hackathon to check authorization
    const hackathon = await HackathonModel.findById(existingFile.hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check if user is the organizer or admin
    if (hackathon.organizerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this file' });
    }

    const data = validationResult.data;

    const updatedFile = await ProvidedFileModel.update(fileId, data);

    return res.status(200).json({
      message: 'Provided file updated successfully',
      file: updatedFile,
    });
  } catch (error) {
    console.error('Update provided file error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a provided file
export const deleteProvidedFile = async (req: AuthRequest, res: Response) => {
  try {
    const fileId = parseInt(req.params.fileId);

    if (!fileId || isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    // Check if file exists
    const existingFile = await ProvidedFileModel.findById(fileId);

    if (!existingFile) {
      return res.status(404).json({ error: 'Provided file not found' });
    }

    // Get hackathon to check authorization
    const hackathon = await HackathonModel.findById(existingFile.hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check if user is the organizer or admin
    if (hackathon.organizerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    await ProvidedFileModel.delete(fileId);
    await deleteUploadedFile(PROVIDED_UPLOAD_DIR, existingFile.fileUrl);

    return res.status(200).json({
      message: 'Provided file deleted successfully',
      deletedFileId: fileId,
    });
  } catch (error) {
    console.error('Delete provided file error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Toggle file visibility (public/private)
export const toggleProvidedFileVisibility = async (req: AuthRequest, res: Response) => {
  try {
    const fileId = parseInt(req.params.fileId);

    if (!fileId || isNaN(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if file exists
    const existingFile = await ProvidedFileModel.findById(fileId);

    if (!existingFile) {
      return res.status(404).json({ error: 'Provided file not found' });
    }

    // Get hackathon to check authorization
    const hackathon = await HackathonModel.findById(existingFile.hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check if user is the organizer or admin
    if (hackathon.organizerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to modify this file' });
    }

    const updatedFile = await ProvidedFileModel.togglePublic(fileId);

    return res.status(200).json({
      message: 'File visibility toggled successfully',
      file: updatedFile,
    });
  } catch (error) {
    console.error('Toggle file visibility error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user's team in a hackathon
export const getMyTeamInHackathon = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    // Check if hackathon exists
    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check if user is in a team for this hackathon
    const isInHackathon = await TeamModel.isUserInHackathon(req.user.userId, hackathonId);

    if (!isInHackathon) {
      return res.status(404).json({
        error: 'You are not part of any team in this hackathon',
        inHackathon: false,
      });
    }

    // Get user's team
    const team = await TeamModel.getUserTeamInHackathon(req.user.userId, hackathonId);

    return res.status(200).json({
      inHackathon: true,
      team,
    });
  } catch (error) {
    console.error('Get my team error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHackathonSurveyQuestionsAdmin = async (req: Request, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const questions = await prisma.surveyQuestion.findMany({
      where: { hackathonId },
      orderBy: { order: 'asc' },
    });

    return res.status(200).json({ questions });
  } catch (error) {
    console.error('Admin get survey questions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const createSurveyQuestion = async (req: Request, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    const validationResult = surveyQuestionSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: validationResult.error.issues });
    }

    const hackathon = await prisma.hackathon.findUnique({ where: { id: hackathonId } });
    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const nextOrder = validationResult.data.order
      ? validationResult.data.order
      : ((await prisma.surveyQuestion.aggregate({
          where: { hackathonId },
          _max: { order: true },
        }))._max.order || 0) + 1;

    const created = await prisma.surveyQuestion.create({
      data: {
        hackathonId,
        question: validationResult.data.question,
        order: nextOrder,
      },
    });

    return res.status(201).json({ question: created });
  } catch (error) {
    console.error('Create survey question error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSurveyQuestion = async (req: Request, res: Response) => {
  try {
    const questionId = parseInt(req.params.questionId);
    if (!questionId || isNaN(questionId)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    const validationResult = updateSurveyQuestionSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: validationResult.error.issues });
    }

    const existing = await prisma.surveyQuestion.findUnique({ where: { id: questionId } });
    if (!existing) {
      return res.status(404).json({ error: 'Survey question not found' });
    }

    const updated = await prisma.surveyQuestion.update({
      where: { id: questionId },
      data: validationResult.data,
    });

    return res.status(200).json({ question: updated });
  } catch (error) {
    console.error('Update survey question error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSurveyQuestion = async (req: Request, res: Response) => {
  try {
    const questionId = parseInt(req.params.questionId);
    if (!questionId || isNaN(questionId)) {
      return res.status(400).json({ error: 'Invalid question ID' });
    }

    const existing = await prisma.surveyQuestion.findUnique({ where: { id: questionId } });
    if (!existing) {
      return res.status(404).json({ error: 'Survey question not found' });
    }

    await prisma.surveyQuestion.delete({ where: { id: questionId } });
    return res.status(200).json({ message: 'Survey question deleted', questionId });
  } catch (error) {
    console.error('Delete survey question error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
