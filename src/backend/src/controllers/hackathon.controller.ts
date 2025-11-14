import { Request, Response } from 'express';
import { HackathonModel } from '../models/hackathon';
import { prisma } from '@prisma';
import { AuthRequest } from '../middleware/auth';

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

    const currentUser = req.user;
    const {
      title,
      description,
      teamMax,
      teamMin,
      registrationOpen,
      startDate,
      endDate,
      rules,
    } = req.body;

    // Validation
    if (!title || !description || !teamMax || !teamMin || !registrationOpen || !startDate || !endDate || !rules) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (teamMin < 1) {
      return res.status(400).json({ error: 'Team minimum must be at least 1' });
    }

    if (teamMax < teamMin) {
      return res.status(400).json({ error: 'Team maximum must be greater than or equal to team minimum' });
    }

    const regOpenDate = new Date(registrationOpen);
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (startDateTime <= regOpenDate) {
      return res.status(400).json({ error: 'Start date must be after registration open date' });
    }

    if (endDateTime <= startDateTime) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const hackathon = await HackathonModel.create({
      title,
      description,
      organizerId: currentUser.userId,
      rules,
      teamMax: teamMax,
      teamMin,
      registrationOpen: regOpenDate,
      startDate: startDateTime,
      endDate: endDateTime,
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
    const {
      title,
      description,
      teamMax,
      teamMin,
      registrationOpen,
      startDate,
      endDate,
    } = req.body;

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
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

    // Validation for team sizes
    if (teamMin !== undefined && teamMin < 1) {
      return res.status(400).json({ error: 'Team minimum must be at least 1' });
    }

    if (teamMax !== undefined && teamMin !== undefined && teamMax < teamMin) {
      return res.status(400).json({ error: 'Team maximum must be greater than or equal to team minimum' });
    }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (teamMax !== undefined) updateData.teamMax = teamMax;
    if (teamMin !== undefined) updateData.teamMin = teamMin;
    if (registrationOpen !== undefined) updateData.registrationOpen = new Date(registrationOpen);
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);

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
