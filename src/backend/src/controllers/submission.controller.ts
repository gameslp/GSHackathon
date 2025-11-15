import { Response } from 'express';
import { z } from 'zod';
import { SubmissionModel } from '../models/submission';
import { SubmissionFileModel } from '../models/submissionFile';
import { HackathonModel } from '../models/hackathon';
import { TeamModel } from '../models/team';
import { AuthRequest } from '../middleware/auth';

// Zod validation schemas
const submitSchema = z.object({
  // url: z.string().url('Must be a valid URL'),
  files: z.array(
    z.object({
      fileFormatId: z.number().int().positive(),
      fileUrl: z.string().url('File URL must be valid'),
    })
  ),
});

const createSubmissionSchema = z.object({
});

export const createSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    // const validationResult = submitSchema.safeParse(req.body);

    // if (!validationResult.success) {
    //   return res.status(400).json({
    //     error: 'Validation failed',
    //     details: validationResult.error.issues,
    //   });
    // }

    // Check if hackathon exists
    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Get user's team in this hackathon
    const userTeam = await TeamModel.getUserTeamInHackathon(req.user.userId, hackathonId);

    if (!userTeam) {
      return res.status(403).json({ error: 'You are not part of an accepted team in this hackathon' });
    }


    // Create submission
    const submission = await SubmissionModel.create({
      teamId: userTeam.id,
      hackathonId,
    });

    return res.status(201).json({
      message: 'Submission created successfully',
      submissionId: submission.id,
    });
  } catch (error) {
    console.error('Create submission error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// Submit a hackathon submission with files
export const submit = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);
    const submissionId = parseInt(req.params.submissionId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ error: 'Invalid submission ID' });
    }

    if (await SubmissionModel.isSend(submissionId)) {
      return res.status(400).json({ error: 'Cannot submit a sent submission' });
    }

    const validationResult = submitSchema.safeParse(req.body);

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

    // Get user's team in this hackathon
    const userTeam = await TeamModel.getUserTeamInHackathon(req.user.userId, hackathonId);

    if (!userTeam) {
      return res.status(403).json({ error: 'You are not part of an accepted team in this hackathon' });
    }

    const isOwner = await SubmissionModel.isTeamSubmissionOwner(submissionId, userTeam.id);

    if (!isOwner) {
      return res.status(403).json({ error: 'You are not the owner of this submission' });
    }

    const data = validationResult.data;

    const submission = await SubmissionModel.update(submissionId, {
      sendAt: new Date(),
    });


    return res.status(201).json({
      message: 'Submission created successfully',
      submission: {
        ...submission,
      },
    });
  } catch (error) {
    console.error('Submit hackathon error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};









// Get submission by ID
export const getSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const submissionId = parseInt(req.params.submissionId);

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ error: 'Invalid submission ID' });
    }

    const submission = await SubmissionModel.findById(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check authorization
    const hackathon = await HackathonModel.findById(submission.hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const isOrganizer = req.user.userId === hackathon.organizerId;
    const isAdmin = req.user.role === 'ADMIN';
    const isJudge = req.user.role === 'JUDGE';
    const isParticipant = await TeamModel.isUserInHackathon(req.user.userId, submission.hackathonId);

    if (!isOrganizer && !isAdmin && !isJudge && !isParticipant) {
      return res.status(403).json({ error: 'Not authorized to view this submission' });
    }

    // Get submission files
    const files = await SubmissionFileModel.findBySubmission(submissionId);

    return res.status(200).json({
      ...submission,
      files,
    });
  } catch (error) {
    console.error('Get submission error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all submissions for a hackathon
export const getHackathonSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check authorization - only organizer, admin, or judges can see all submissions
    const isOrganizer = req.user.userId === hackathon.organizerId;
    const isAdmin = req.user.role === 'ADMIN';
    const isJudge = req.user.role === 'JUDGE';

    if (!isOrganizer && !isAdmin && !isJudge) {
      return res.status(403).json({ error: 'Not authorized to view all submissions' });
    }

    const submissions = await SubmissionModel.findByHackathon(hackathonId);

    return res.status(200).json(submissions);
  } catch (error) {
    console.error('Get hackathon submissions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get team's submission for a hackathon
export const getMyTeamSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.params.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Get user's team
    const userTeam = await TeamModel.getUserTeamInHackathon(req.user.userId, hackathonId);

    if (!userTeam) {
      return res.status(404).json({ error: 'You are not part of a team in this hackathon' });
    }

    const submission = await SubmissionModel.findByTeamAndHackathon(userTeam.id, hackathonId);

    if (!submission) {
      return res.status(404).json({ error: 'No submission found for your team' });
    }

    // Get submission files
    const files = await SubmissionFileModel.findBySubmission(submission.id);

    return res.status(200).json({
      ...submission,
      files,
    });
  } catch (error) {
    console.error('Get my team submission error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Update submission score (for judges/organizers)
export const scoreSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const submissionId = parseInt(req.params.submissionId);

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ error: 'Invalid submission ID' });
    }

    const { score, scoreComment } = req.body;

    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Valid score is required' });
    }

    const submission = await SubmissionModel.findById(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check authorization - only organizer, admin, or judges can score
    const hackathon = await HackathonModel.findById(submission.hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const isOrganizer = req.user.userId === hackathon.organizerId;
    const isAdmin = req.user.role === 'ADMIN';
    const isJudge = req.user.role === 'JUDGE';

    if (!isOrganizer && !isAdmin && !isJudge) {
      return res.status(403).json({ error: 'Not authorized to score submissions' });
    }

    const updatedSubmission = await SubmissionModel.update(submissionId, {
      score,
      scoreComment: scoreComment || null,
    });

    return res.status(200).json({
      message: 'Submission scored successfully',
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error('Score submission error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
