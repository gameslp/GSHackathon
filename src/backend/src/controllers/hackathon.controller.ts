import { Request, Response } from 'express';
import { prisma } from '@prisma';

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
