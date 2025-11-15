import { Response } from 'express';
import { z } from 'zod';
import { SubmissionModel } from '../models/submission';
import { SubmissionFileModel } from '../models/submissionFile';
import { HackathonModel } from '../models/hackathon';
import { TeamModel } from '../models/team';
import { AuthRequest } from '../middleware/auth';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { uploadDir } from './fileUpload.controller';

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
      scoredAt: new Date(),
      scoreManual: true,
      scoreId: null
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

// Get AI assistance for submission's Python code
export const getAICodeAssistance = async (req: AuthRequest, res: Response) => {
  try {
    const submissionId = parseInt(req.params.submissionId);
    const pythonFile = req.body.pythonFile as string | undefined;

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ error: 'Invalid submission ID' });
    }

    // Check if submission exists
    const submission = await SubmissionModel.findById(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
   
    if (!pythonFile && pythonFile!.endsWith('.py')) {
      return res.status(400).json({ error: 'pythonFile parameter is required' });
    }

    // Get user's team
    const userTeam = await TeamModel.getUserTeamInHackathon(req.user.userId, submission.hackathonId);

    if (!userTeam) {
      return res.status(403).json({ error: 'You are not part of an accepted team in this hackathon' });
    }

    // Check if user's team owns this submission
    const isOwner = await SubmissionModel.isTeamSubmissionOwner(submissionId, userTeam.id);

    if (!isOwner) {
      return res.status(403).json({ error: 'Not authorized to get assistance for this submission' });
    }

    // Get all submission files
    const files = await SubmissionFileModel.findBySubmission(submissionId);

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files found in this submission' });
    }

    files.find(f => f.fileUrl === pythonFile);

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const filePath = path.join(__dirname, uploadDir, pythonFile!);
    const fileSize = fs.statSync(filePath).size;
    
    if (fileSize > 10000) {
      return res.status(400).json({ error: 'The specified file is too large for analysis' });
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Prepare code context for ChatGPT
    const prompt = `You are a strict coding assistant for a data science hackathon. Analyze the following Python code and provide:

1. Potential improvements or optimizations
2. Any bugs or issues you notice
3. Suggestions for better practices

and return them as json: 
{"hints": [{"message": <string>, "line": <number>}]}
and return nothing else.

Here is the code:

${fileContent}`;

    // Call ChatGPT API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a strict coding assistant for a data science hackathon. Analyze the following Python code and provide constructive feedback in the specified JSON format in english. Return nothing else.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const assistanceResponse = completion.choices[0]?.message?.content || 'No response generated';
    const typedResponse: { hints: { message: string; line: number }[] } = JSON.parse(assistanceResponse);

    return res.status(200).json({
      message: 'AI assistance generated successfully',
      assistance: typedResponse,
    });
  } catch (error) {
    console.error('Get AI code assistance error:', error);

    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(500).json({ error: 'OpenAI API not configured' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};
