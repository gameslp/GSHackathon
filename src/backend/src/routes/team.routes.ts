import { Router } from 'express';
import {
  createTeam,
  joinTeam,
  getMyTeam,
  getHackathonSurvey,
  getUserTeams,
} from '../controllers/team.controller';
import { auth } from '../middleware/auth';

const teamRouter = Router();

/**
 * @openapi
 * /teams/create:
 *   post:
 *     tags:
 *       - Teams
 *     summary: Create a new team
 *     description: Create a new team for a hackathon with survey responses
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hackathonId
 *               - teamName
 *               - surveyResponses
 *             properties:
 *               hackathonId:
 *                 type: integer
 *                 description: ID of the hackathon
 *               teamName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 description: Name of the team
 *               surveyResponses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - answer
 *                   properties:
 *                     questionId:
 *                       type: integer
 *                     answer:
 *                       type: string
 *     responses:
 *       201:
 *         description: Team created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 team:
 *                   $ref: '#/components/schemas/TeamDetails'
 *       400:
 *         description: Validation failed or user already in team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
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
teamRouter.post('/teams/create', auth, createTeam);

/**
 * @openapi
 * /teams/join:
 *   post:
 *     tags:
 *       - Teams
 *     summary: Join an existing team
 *     description: Join a team using a 6-digit invitation code with survey responses
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitationCode
 *               - surveyResponses
 *             properties:
 *               invitationCode:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 description: 6-digit team invitation code
 *                 example: '123456'
 *               surveyResponses:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - answer
 *                   properties:
 *                     questionId:
 *                       type: integer
 *                     answer:
 *                       type: string
 *     responses:
 *       200:
 *         description: Successfully joined team
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 team:
 *                   $ref: '#/components/schemas/TeamDetails'
 *       400:
 *         description: Validation failed, team full, or user already in team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Invalid invitation code
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
teamRouter.post('/teams/join', auth, joinTeam);

/**
 * @openapi
 * /teams/hackathon/{hackathonId}:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Get my team for a hackathon
 *     description: Retrieve the user's team information for a specific hackathon
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
 *         description: Team information retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 team:
 *                   $ref: '#/components/schemas/TeamDetails'
 *       400:
 *         description: Invalid hackathon ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not in a team for this hackathon
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
teamRouter.get('/teams/hackathon/:hackathonId', auth, getMyTeam);

/**
 * @openapi
 * /teams/hackathon/{hackathonId}/survey:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Get hackathon survey questions
 *     description: Retrieve survey questions for a specific hackathon
 *     parameters:
 *       - in: path
 *         name: hackathonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hackathon ID
 *     responses:
 *       200:
 *         description: Survey questions retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       question:
 *                         type: string
 *                       order:
 *                         type: integer
 *       400:
 *         description: Invalid hackathon ID
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
teamRouter.get('/teams/hackathon/:hackathonId/survey', getHackathonSurvey);

/**
 * @openapi
 * /teams/my:
 *   get:
 *     tags:
 *       - Teams
 *     summary: Get all teams for current user
 *     description: Retrieve all teams that the authenticated user is a member of
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Teams retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teams:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       invitationCode:
 *                         type: string
 *                       captainId:
 *                         type: integer
 *                       isCaptain:
 *                         type: boolean
 *                       isAccepted:
 *                         type: boolean
 *                       memberCount:
 *                         type: integer
 *                       hackathon:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           startDate:
 *                             type: string
 *                             format: date-time
 *                           endDate:
 *                             type: string
 *                             format: date-time
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Internal server error
 */
teamRouter.get('/teams/my', auth, getUserTeams);

export default teamRouter;
