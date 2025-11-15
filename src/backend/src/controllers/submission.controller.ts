import { Response } from 'express';
import { z } from 'zod';
import { SubmissionModel } from '../models/submission';
import { SubmissionFileModel } from '../models/submissionFile';
import { HackathonModel } from '../models/hackathon';
import { TeamModel } from '../models/team';
import { SubmissionFileFormatModel } from '../models/submissionFileFormat';
import { AuthRequest } from '../middleware/auth';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { uploadDir } from './fileUpload.controller';
import { scoringQueue } from 'src/models/scoringQueue';

// Zod validation schemas
const submitSchema = z.object({
  // url: z.string().url('Must be a valid URL'),
  files: z.array(
    z.object({
      fileFormatId: z.number().int().positive(),
      fileUrl: z.string().min(1, 'File URL is required'),
    })
  ),
});

const createSubmissionSchema = z.object({});

const draftFilesSchema = z.object({
  files: z
    .array(
      z.object({
        fileFormatId: z.number().int().positive(),
        fileUrl: z.string().min(1, 'File URL is required'),
      })
    )
    .default([]),
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


    const submissionLimit = hackathon.submissionLimit ?? null;

    const existingDraft = await SubmissionModel.findDraftByTeamAndHackathon(userTeam.id, hackathonId);

    if (existingDraft) {
      return res.status(200).json({
        message: 'Draft submission already exists',
        submissionId: existingDraft.id,
      });
    }

    if (submissionLimit) {
      const submittedCount = await SubmissionModel.countSubmittedByTeam(userTeam.id, hackathonId);
      if (submittedCount >= submissionLimit) {
        return res.status(400).json({
          error: 'Submission limit reached for this hackathon',
        });
      }
    }

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

    // Get all file format requirements for this hackathon
    const requiredFormats = await SubmissionFileFormatModel.findByHackathon(hackathonId);
    const obligatoryFormats = requiredFormats.filter(format => format.obligatory);

    // Check if all obligatory formats are present in the submission
    const uploadedFormatIds = new Set((data.files || []).map(f => f.fileFormatId));
    const missingFormats = obligatoryFormats.filter(format => !uploadedFormatIds.has(format.id));

    if (missingFormats.length > 0) {
      const missingNames = missingFormats.map(f => f.name).join(', ');
      return res.status(400).json({
        error: `Missing required files: ${missingNames}`,
      });
    }

    const submissionLimit = hackathon.submissionLimit ?? null;
    if (submissionLimit) {
      const submittedCount = await SubmissionModel.countSubmittedByTeam(userTeam.id, hackathonId);
      if (submittedCount >= submissionLimit) {
        return res.status(400).json({
          error: 'Submission limit reached for this hackathon',
        });
      }
    }

    // Validate that all provided file format IDs exist and belong to this hackathon
    if (data.files && data.files.length > 0) {
      for (const file of data.files) {
        const format = requiredFormats.find(f => f.id === file.fileFormatId);
        if (!format) {
          return res.status(400).json({
            error: `Invalid file format ID: ${file.fileFormatId}`,
          });
        }
      }
    }

    await SubmissionFileModel.deleteBySubmission(submissionId);

    if (data.files && data.files.length > 0) {
      await SubmissionFileModel.createMany(
        data.files.map((file) => ({
          submissionId,
          fileFormatId: file.fileFormatId,
          fileUrl: file.fileUrl,
        }))
      );
    }

    // Update submission as sent
    const submission = await SubmissionModel.update(submissionId, {
      sendAt: new Date(),
    });

    if(hackathon.autoScoringEnabled) scoringQueue.addToQueue(submission.id, 1);

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

export const saveDraftSubmissionFiles = async (req: AuthRequest, res: Response) => {
  try {
    const submissionId = parseInt(req.params.submissionId);

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ error: 'Invalid submission ID' });
    }

    const validationResult = draftFilesSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.error.issues,
      });
    }

    const submission = await SubmissionModel.findById(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (submission.sendAt) {
      return res.status(400).json({ error: 'Cannot edit files of a finalized submission' });
    }

    const hackathon = await HackathonModel.findById(submission.hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const userTeam = await TeamModel.getUserTeamInHackathon(req.user.userId, submission.hackathonId);

    if (!userTeam || userTeam.id !== submission.teamId) {
      return res.status(403).json({ error: 'You are not the owner of this submission' });
    }

    const formats = await SubmissionFileFormatModel.findByHackathon(submission.hackathonId);
    const formatIds = new Set(formats.map((format) => format.id));

    for (const file of validationResult.data.files ?? []) {
      if (!formatIds.has(file.fileFormatId)) {
        return res.status(400).json({ error: `Invalid file format ID: ${file.fileFormatId}` });
      }
    }

    await SubmissionFileModel.deleteBySubmission(submissionId);

    if (validationResult.data.files.length > 0) {
      await SubmissionFileModel.createMany(
        validationResult.data.files.map((file) => ({
          submissionId,
          fileFormatId: file.fileFormatId,
          fileUrl: file.fileUrl,
        }))
      );
    }

    const files = await SubmissionFileModel.findBySubmission(submissionId);

    return res.status(200).json({
      message: 'Draft files updated successfully',
      files,
    });
  } catch (error) {
    console.error('Save draft submission files error:', error);
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

// Get all team's submissions for a hackathon
export const getMyTeamSubmissions = async (req: AuthRequest, res: Response) => {
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
      return res.status(200).json([]); // Return empty array if not in a team
    }

    const submissions = await SubmissionModel.findAllByTeamAndHackathon(userTeam.id, hackathonId);

    // Get files for each submission
    const submissionsWithFiles = await Promise.all(
      submissions.map(async (submission) => {
        const files = await SubmissionFileModel.findBySubmission(submission.id);
        return {
          ...submission,
          files,
        };
      })
    );

    return res.status(200).json(submissionsWithFiles);
  } catch (error) {
    console.error('Get my team submissions error:', error);
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

export const triggerRejudgeScoring = async (req: AuthRequest, res: Response) => {
  try{
    const submissionId = parseInt(req.params.submissionId);

    if (!submissionId || isNaN(submissionId)) {
      return res.status(400).json({ error: 'Invalid submission ID' });
    }

    const submission = await SubmissionModel.findById(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const hackathon = await HackathonModel.findById(submission.hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const isOrganizer = req.user.userId === hackathon.organizerId;
    const isAdmin = req.user.role === 'ADMIN';
    const isJudge = req.user.role === 'JUDGE';

    if(!hackathon.autoScoringEnabled) {
      return res.status(400).json({ error: 'Auto scoring is not enabled for this hackathon' });
    }

    if (!isOrganizer && !isAdmin && !isJudge) {
      return res.status(403).json({ error: 'Not authorized to score submissions' });
    }

    await SubmissionModel.triggerRejudgeScoring(submissionId);
    return res.status(200).json({ message: 'Rejudge scoring triggered successfully' });
  }
  catch (error) {
    console.error('Trigger rejudge scoring error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const triggerAllRejudgeScoring = async (req: AuthRequest, res: Response) => {
  try{
    const hackathon = await HackathonModel.findById(parseInt(req.params.hackathonId));

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const isOrganizer = req.user.userId === hackathon.organizerId;
    const isAdmin = req.user.role === 'ADMIN';
    const isJudge = req.user.role === 'JUDGE';

    if (!isOrganizer && !isAdmin && !isJudge) {
      return res.status(403).json({ error: 'Not authorized to score submissions' });
    }

    if(!hackathon.autoScoringEnabled) {
      return res.status(400).json({ error: 'Auto scoring is not enabled for this hackathon' });
    }

    await SubmissionModel.triggerAllRejudgeScoringForHackathon(hackathon.id);
    return res.status(200).json({ message: 'Rejudge scoring triggered successfully' });
  }
  catch (error) {
    console.error('Trigger all rejudge scoring error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

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
