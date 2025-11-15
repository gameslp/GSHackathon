import { Router } from 'express';
import {
  createSubmission,
  submit,
  saveDraftSubmissionFiles,
  getSubmission,
  getHackathonSubmissions,
  getMyTeamSubmission,
  getMyTeamSubmissions,
  scoreSubmission,
  getAICodeAssistance,
} from '../controllers/submission.controller';
import { auth } from '../middleware/auth';

const submissionRouter = Router();

/**
 * @openapi
 * /hackathons/{hackathonId}/submissions:
 *   post:
 *     tags:
 *       - Submissions
 *     summary: Create a draft submission
 *     description: Create a draft submission for a hackathon (team member only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: hackathonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hackathon ID
 *     responses:
 *       201:
 *         description: Submission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 submissionId:
 *                   type: integer
 *       400:
 *         description: Invalid hackathon ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not part of an accepted team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Hackathon not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
submissionRouter.post('/hackathons/:hackathonId/submissions', auth, createSubmission);

/**
 * @openapi
 * /hackathons/{hackathonId}/submissions/{submissionId}/submit:
 *   post:
 *     tags:
 *       - Submissions
 *     summary: Submit/finalize a submission
 *     description: Finalize a submission by setting sendAt timestamp (team member only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: hackathonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hackathon ID
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fileFormatId:
 *                       type: integer
 *                     fileUrl:
 *                       type: string
 *     responses:
 *       201:
 *         description: Submission submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 submission:
 *                   type: object
 *       400:
 *         description: Validation failed or submission already sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Hackathon not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
submissionRouter.post('/hackathons/:hackathonId/submissions/:submissionId/submit', auth, submit);

/**
 * @openapi
 * /submissions/{submissionId}/files:
 *   put:
 *     tags:
 *       - Submissions
 *     summary: Save draft submission files
 *     description: Persist draft submission files so the team can return later
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     fileFormatId:
 *                       type: integer
 *                     fileUrl:
 *                       type: string
 *     responses:
 *       200:
 *         description: Draft files saved successfully
 *       400:
 *         description: Invalid submission ID or payload
 *       403:
 *         description: Not authorized to edit this submission
 *       404:
 *         description: Submission not found
 *       500:
 *         description: Internal server error
 */
submissionRouter.put('/submissions/:submissionId/files', auth, saveDraftSubmissionFiles);

/**
 * @openapi
 * /submissions/{submissionId}:
 *   get:
 *     tags:
 *       - Submissions
 *     summary: Get submission by ID
 *     description: Retrieve submission details with files (organizer/admin/judge/participant)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Submission ID
 *     responses:
 *       200:
 *         description: Submission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 teamId:
 *                   type: integer
 *                 hackathonId:
 *                   type: integer
 *                 url:
 *                   type: string
 *                 score:
 *                   type: number
 *                   nullable: true
 *                 scoreComment:
 *                   type: string
 *                   nullable: true
 *                 sendAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid submission ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to view this submission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Submission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
submissionRouter.get('/submissions/:submissionId', auth, getSubmission);

/**
 * @openapi
 * /hackathons/{hackathonId}/submissions:
 *   get:
 *     tags:
 *       - Submissions
 *     summary: Get all submissions for a hackathon
 *     description: Retrieve all submissions for a hackathon (organizer/admin/judge only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: hackathonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hackathon ID
 *     responses:
 *       200:
 *         description: Submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Invalid hackathon ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to view all submissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Hackathon not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
submissionRouter.get('/hackathons/:hackathonId/submissions', auth, getHackathonSubmissions);

/**
 * @openapi
 * /hackathons/{hackathonId}/my-submission:
 *   get:
 *     tags:
 *       - Submissions
 *     summary: Get current user's team submission
 *     description: Retrieve the submission for the current user's team in a hackathon
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: hackathonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hackathon ID
 *     responses:
 *       200:
 *         description: Team submission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 teamId:
 *                   type: integer
 *                 hackathonId:
 *                   type: integer
 *                 url:
 *                   type: string
 *                 score:
 *                   type: number
 *                   nullable: true
 *                 scoreComment:
 *                   type: string
 *                   nullable: true
 *                 sendAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid hackathon ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Hackathon or submission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
submissionRouter.get('/hackathons/:hackathonId/my-submission', auth, getMyTeamSubmission);

/**
 * @openapi
 * /hackathons/{hackathonId}/my-submissions:
 *   get:
 *     tags:
 *       - Submissions
 *     summary: Get all current user's team submissions
 *     description: Retrieve all submissions for the current user's team in a hackathon
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: hackathonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hackathon ID
 *     responses:
 *       200:
 *         description: Team submissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Invalid hackathon ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Hackathon not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
submissionRouter.get('/hackathons/:hackathonId/my-submissions', auth, getMyTeamSubmissions);

/**
 * @openapi
 * /submissions/{submissionId}/score:
 *   post:
 *     tags:
 *       - Submissions
 *     summary: Score a submission
 *     description: Assign a score to a submission (organizer/admin/judge only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: number
 *                 minimum: 0
 *                 description: Score to assign
 *               scoreComment:
 *                 type: string
 *                 description: Optional comment about the score
 *     responses:
 *       200:
 *         description: Submission scored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 submission:
 *                   type: object
 *       400:
 *         description: Invalid submission ID or score
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to score submissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Submission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
submissionRouter.post('/submissions/:submissionId/score', auth, scoreSubmission);

/**
 * @openapi
 * /submissions/{submissionId}/ai-assistance:
 *   post:
 *     tags:
 *       - Submissions
 *     summary: Get AI code assistance
 *     description: Analyze a specific Python file in submission and get AI-generated hints from ChatGPT (team member only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: submissionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Submission ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pythonFile
 *             properties:
 *               pythonFile:
 *                 type: string
 *                 description: Path to the Python file to analyze (must end with .py)
 *                 example: "solution.py"
 *     responses:
 *       200:
 *         description: AI assistance generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "AI assistance generated successfully"
 *                 assistance:
 *                   type: object
 *                   properties:
 *                     hints:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           message:
 *                             type: string
 *                             description: Hint or suggestion message
 *                           line:
 *                             type: integer
 *                             description: Line number where the issue occurs
 *                       description: Array of AI-generated hints with line numbers
 *       400:
 *         description: Invalid submission ID, pythonFile not provided, or file too large (>10KB)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to get assistance for this submission
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Submission not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or OpenAI API not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
submissionRouter.post('/submissions/:submissionId/ai-assistance', auth, getAICodeAssistance);

export default submissionRouter;
