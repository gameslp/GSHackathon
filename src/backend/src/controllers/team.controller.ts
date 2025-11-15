import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@prisma';

// Zod schemas
const createTeamSchema = z.object({
  hackathonId: z.number().int().positive(),
  teamName: z.string().min(1).max(100),
  surveyResponses: z.array(z.object({
    questionId: z.number().int().positive(),
    answer: z.string(),
  })),
});

const joinTeamSchema = z.object({
  invitationCode: z.string().length(6).regex(/^\d{6}$/),
  surveyResponses: z.array(z.object({
    questionId: z.number().int().positive(),
    answer: z.string(),
  })),
});

// Helper to generate 6-digit invitation code
const generateInvitationCode = async (): Promise<string> => {
  let code: string;
  let exists = true;

  while (exists) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const team = await prisma.team.findUnique({
      where: { invitationCode: code },
    });
    exists = !!team;
  }

  return code!;
};

export const createTeam = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate request
    const validationResult = createTeamSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const { hackathonId, teamName, surveyResponses } = validationResult.data;

    // Check if hackathon exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      include: { surveyQuestions: true, teams: true },
    });

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check if registration is open
    const now = new Date();
    if (now < hackathon.registrationOpen || now > hackathon.startDate) {
      return res.status(400).json({ error: 'Hackathon registration is not open' });
    }

    // Check if user is already in a team for this hackathon
    const existingTeam = await prisma.team.findFirst({
      where: {
        hackathonId,
        members: {
          some: { id: user.userId },
        },
      },
    });

    if (existingTeam) {
      return res.status(400).json({ error: 'You are already in a team for this hackathon' });
    }

    // Validate survey responses
    if (surveyResponses.length !== hackathon.surveyQuestions.length) {
      return res.status(400).json({ error: 'All survey questions must be answered' });
    }

    const questionIds = hackathon.surveyQuestions.map(q => q.id);
    const responseQuestionIds = surveyResponses.map(r => r.questionId);
    if (!questionIds.every(id => responseQuestionIds.includes(id))) {
      return res.status(400).json({ error: 'Invalid survey question IDs' });
    }

    // Generate invitation code
    const invitationCode = await generateInvitationCode();

    // Create team with captain and survey responses
    const team = await prisma.team.create({
      data: {
        name: teamName,
        invitationCode,
        captainId: user.userId,
        hackathonId,
        members: {
          connect: { id: user.userId },
        },
        surveyResponses: {
          create: surveyResponses.map(response => ({
            questionId: response.questionId,
            userId: user.userId,
            answer: response.answer,
          })),
        },
      },
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
            teamMax: true,
            teamMin: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: 'Team created successfully',
      team: {
        id: team.id,
        name: team.name,
        invitationCode: team.invitationCode,
        captainId: team.captainId,
        isAccepted: team.isAccepted,
        hackathon: team.hackathon,
        members: team.members,
        createdAt: team.createdAt,
      },
    });
  } catch (error) {
    console.error('Create team error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const joinTeam = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate request
    const validationResult = joinTeamSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const { invitationCode, surveyResponses } = validationResult.data;

    // Find team by invitation code
    const team = await prisma.team.findUnique({
      where: { invitationCode },
      include: {
        members: true,
        hackathon: {
          include: { surveyQuestions: true },
        },
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'Invalid invitation code' });
    }

    // Check if registration is open
    const now = new Date();
    if (now < team.hackathon.registrationOpen || now > team.hackathon.startDate) {
      return res.status(400).json({ error: 'Hackathon registration is not open' });
    }

    // Check if user is already in this team
    if (team.members.some(member => member.id === user.userId)) {
      return res.status(400).json({ error: 'You are already in this team' });
    }

    // Check if user is already in another team for this hackathon
    const existingTeam = await prisma.team.findFirst({
      where: {
        hackathonId: team.hackathonId,
        members: {
          some: { id: user.userId },
        },
      },
    });

    if (existingTeam) {
      return res.status(400).json({ error: 'You are already in a team for this hackathon' });
    }

    // Check if team is full
    if (team.members.length >= team.hackathon.teamMax) {
      return res.status(400).json({ error: 'Team is full' });
    }

    // Validate survey responses
    if (surveyResponses.length !== team.hackathon.surveyQuestions.length) {
      return res.status(400).json({ error: 'All survey questions must be answered' });
    }

    const questionIds = team.hackathon.surveyQuestions.map(q => q.id);
    const responseQuestionIds = surveyResponses.map(r => r.questionId);
    if (!questionIds.every(id => responseQuestionIds.includes(id))) {
      return res.status(400).json({ error: 'Invalid survey question IDs' });
    }

    // Add user to team and save survey responses
    const updatedTeam = await prisma.team.update({
      where: { id: team.id },
      data: {
        members: {
          connect: { id: user.userId },
        },
        surveyResponses: {
          create: surveyResponses.map(response => ({
            questionId: response.questionId,
            userId: user.userId,
            answer: response.answer,
          })),
        },
      },
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
            teamMax: true,
            teamMin: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: 'Successfully joined team',
      team: {
        id: updatedTeam.id,
        name: updatedTeam.name,
        invitationCode: updatedTeam.invitationCode,
        captainId: updatedTeam.captainId,
        isAccepted: updatedTeam.isAccepted,
        hackathon: updatedTeam.hackathon,
        members: updatedTeam.members,
        createdAt: updatedTeam.createdAt,
      },
    });
  } catch (error) {
    console.error('Join team error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyTeam = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const hackathonId = parseInt(req.params.hackathonId);

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    // Find user's team for this hackathon
    const team = await prisma.team.findFirst({
      where: {
        hackathonId,
        members: {
          some: { id: user.userId },
        },
      },
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
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'You are not in a team for this hackathon' });
    }

    return res.status(200).json({
      team: {
        id: team.id,
        name: team.name,
        invitationCode: team.invitationCode,
        captainId: team.captainId,
        isAccepted: team.isAccepted,
        hackathon: team.hackathon,
        members: team.members,
        createdAt: team.createdAt,
      },
    });
  } catch (error) {
    console.error('Get my team error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getHackathonSurvey = async (req: Request, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    const surveyQuestions = await prisma.surveyQuestion.findMany({
      where: { hackathonId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        question: true,
        order: true,
      },
    });

    return res.status(200).json({ questions: surveyQuestions });
  } catch (error) {
    console.error('Get hackathon survey error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserTeams = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: { id: user.userId },
        },
      },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
        members: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      invitationCode: team.invitationCode,
      captainId: team.captainId,
      isCaptain: team.captainId === user.userId,
      isAccepted: team.isAccepted,
      hackathon: team.hackathon,
      memberCount: team.members.length,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    }));

    return res.status(200).json({ teams: formattedTeams });
  } catch (error) {
    console.error('Get user teams error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
