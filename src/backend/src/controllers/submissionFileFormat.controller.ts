import { Response } from 'express';
import { z } from 'zod';
import { SubmissionFileFormatModel } from '../models/submissionFileFormat';
import { HackathonModel } from '../models/hackathon';
import { TeamModel } from '../models/team';
import { AuthRequest } from '../middleware/auth';

// Zod validation schemas
const createSubmissionFileFormatSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(10).max(500),
  extension: z.string().regex(/^\.[a-zA-Z0-9]+$/, 'Extension must start with a dot (e.g., .csv, .pdf)'),
  maxSizeKB: z.number().int().min(1).max(1024 * 100), // Max 100MB
  obligatory: z.boolean().optional().default(false),
});

const updateSubmissionFileFormatSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  extension: z.string().regex(/^\.[a-zA-Z0-9]+$/, 'Extension must start with a dot (e.g., .csv, .pdf)').optional(),
  maxSizeKB: z.number().int().min(1).max(1024 * 100).optional(),
  obligatory: z.boolean().optional(),
});

// Get submission file format requirements for a hackathon
export const getSubmissionFileFormats = async (req: AuthRequest, res: Response) => {
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

    // Check if user is organizer, admin, or participant in the hackathon
    const isOrganizer = req.user.userId === hackathon.organizerId;
    const isAdmin = req.user.role === 'ADMIN';
    const isParticipant = await TeamModel.isUserInHackathon(req.user.userId, hackathonId);

    if (!isOrganizer && !isAdmin && !isParticipant) {
      return res.status(403).json({ error: 'Not authorized to view file formats for this hackathon' });
    }

    const formats = await SubmissionFileFormatModel.findByHackathon(hackathonId);

    return res.status(200).json(formats);
  } catch (error) {
    console.error('Get submission file formats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a submission file format requirement
export const createSubmissionFileFormat = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    // Validate request body
    const validationResult = createSubmissionFileFormatSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    // Check if hackathon exists
    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check if user is the organizer or admin
    if (hackathon.organizerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to add file formats to this hackathon' });
    }

    const data = validationResult.data;

    const format = await SubmissionFileFormatModel.create({
      name: data.name,
      hackathonId,
      description: data.description,
      extension: data.extension.toLowerCase(),
      maxSizeKB: data.maxSizeKB,
      obligatory: data.obligatory,
    });

    return res.status(201).json({
      message: 'Submission file format created successfully',
      format,
    });
  } catch (error) {
    console.error('Create submission file format error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a submission file format
export const updateSubmissionFileFormat = async (req: AuthRequest, res: Response) => {
  try {
    const formatId = parseInt(req.params.formatId);

    if (!formatId || isNaN(formatId)) {
      return res.status(400).json({ error: 'Invalid format ID' });
    }

    // Validate request body
    const validationResult = updateSubmissionFileFormatSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    // Check if format exists
    const existingFormat = await SubmissionFileFormatModel.findById(formatId);

    if (!existingFormat) {
      return res.status(404).json({ error: 'Submission file format not found' });
    }

    // Get hackathon to check authorization
    const hackathon = await HackathonModel.findById(existingFormat.hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check if user is the organizer or admin
    if (hackathon.organizerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this format' });
    }

    const data = validationResult.data;

    // Normalize extension to lowercase if provided
    const updateData = {
      ...data,
      extension: data.extension ? data.extension.toLowerCase() : undefined,
    };

    const updatedFormat = await SubmissionFileFormatModel.update(formatId, updateData);

    return res.status(200).json({
      message: 'Submission file format updated successfully',
      format: updatedFormat,
    });
  } catch (error) {
    console.error('Update submission file format error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a submission file format
export const deleteSubmissionFileFormat = async (req: AuthRequest, res: Response) => {
  try {
    const formatId = parseInt(req.params.formatId);

    if (!formatId || isNaN(formatId)) {
      return res.status(400).json({ error: 'Invalid format ID' });
    }

    // Check if format exists
    const existingFormat = await SubmissionFileFormatModel.findById(formatId);

    if (!existingFormat) {
      return res.status(404).json({ error: 'Submission file format not found' });
    }

    // Get hackathon to check authorization
    const hackathon = await HackathonModel.findById(existingFormat.hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check if user is the organizer or admin
    if (hackathon.organizerId !== req.user.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this format' });
    }

    await SubmissionFileFormatModel.delete(formatId);

    return res.status(200).json({
      message: 'Submission file format deleted successfully',
      deletedFormatId: formatId,
    });
  } catch (error) {
    console.error('Delete submission file format error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Validate a file against a specific format requirement
export const validateSubmissionFile = async (req: AuthRequest, res: Response) => {
  try {
    const formatId = parseInt(req.params.formatId);
    const { fileName, fileSizeKB } = req.body;

    if (!formatId || isNaN(formatId)) {
      return res.status(400).json({ error: 'Invalid format ID' });
    }

    if (!fileName || typeof fileName !== 'string') {
      return res.status(400).json({ error: 'File name is required' });
    }

    if (!fileSizeKB || typeof fileSizeKB !== 'number') {
      return res.status(400).json({ error: 'File size in KB is required' });
    }

    // Check if format exists
    const format = await SubmissionFileFormatModel.findById(formatId);

    if (!format) {
      return res.status(404).json({ error: 'Format not found' });
    }

    // Get hackathon to check authorization
    const hackathon = await HackathonModel.findById(format.hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check if user is organizer, admin, or participant in the hackathon
    const isOrganizer = req.user.userId === hackathon.organizerId;
    const isAdmin = req.user.role === 'ADMIN';
    const isParticipant = await TeamModel.isUserInHackathon(req.user.userId, format.hackathonId);

    if (!isOrganizer && !isAdmin && !isParticipant) {
      return res.status(403).json({ error: 'Not authorized to validate files for this hackathon' });
    }

    const validation = await SubmissionFileFormatModel.validateFileSubmission(
      formatId,
      fileName,
      fileSizeKB
    );

    return res.status(200).json(validation);
  } catch (error) {
    console.error('Validate submission file error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
