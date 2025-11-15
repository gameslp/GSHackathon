import { Router } from 'express';
import {
  getHackathonTeams,
  getTeamDetails,
  acceptTeam,
  rejectTeam,
  getHackathons,
  getHackathonById,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  getActiveHackathons,
  getUpcomingHackathons,
  getHackathonsByOrganizer,
  createHackathonResource,
  deleteHackathonResource,
  getProvidedFiles,
  createProvidedFile,
  updateProvidedFile,
  deleteProvidedFile,
  toggleProvidedFileVisibility,
} from '../controllers/hackathon.controller';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { Role } from '../generated/prisma/enums';
import { resourceUpload, providedUpload } from '../lib/uploads';

const hackathonRouter = Router();

// Admin-only routes for hackathon management
const adminAuth = [auth, requireRole([Role.ADMIN])];

/**
 * @openapi
 * /hackathons/{hackathonId}/teams:
 *   get:
 *     tags:
 *       - Hackathon Management
 *     summary: Get all teams for a hackathon
 *     description: Retrieve paginated list of teams for hackathon management (Admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: hackathonId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hackathon ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of teams per page
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
 *                     $ref: '#/components/schemas/TeamSummary'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
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
 *       403:
 *         description: Forbidden - Admin access required
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
hackathonRouter.get('/hackathons/:hackathonId/teams', ...adminAuth, getHackathonTeams);

/**
 * @openapi
 * /hackathons/teams/{teamId}:
 *   get:
 *     tags:
 *       - Hackathon Management
 *     summary: Get team details with survey responses
 *     description: View team with all member survey responses (Admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 team:
 *                   $ref: '#/components/schemas/TeamWithSurvey'
 *       400:
 *         description: Invalid team ID
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
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Team not found
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
hackathonRouter.get('/hackathons/teams/:teamId', ...adminAuth, getTeamDetails);

/**
 * @openapi
 * /hackathons/teams/{teamId}/accept:
 *   post:
 *     tags:
 *       - Hackathon Management
 *     summary: Accept a team
 *     description: Mark a team as accepted (Admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 team:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     isAccepted:
 *                       type: boolean
 *                     hackathon:
 *                       type: object
 *                     members:
 *                       type: array
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid team ID or team already accepted
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
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Team not found
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
hackathonRouter.post('/hackathons/teams/:teamId/accept', ...adminAuth, acceptTeam);

/**
 * @openapi
 * /hackathons/teams/{teamId}/reject:
 *   post:
 *     tags:
 *       - Hackathon Management
 *     summary: Reject a team
 *     description: Mark a team as rejected (Admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 team:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     isAccepted:
 *                       type: boolean
 *                     hackathon:
 *                       type: object
 *                     members:
 *                       type: array
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid team ID
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
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Team not found
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
hackathonRouter.post('/hackathons/teams/:teamId/reject', ...adminAuth, rejectTeam);

/**
 * @openapi
 * /hackathons:
 *   get:
 *     tags:
 *       - Hackathon Management
 *     summary: Get all hackathons
 *     description: Retrieve paginated list of all hackathons
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of hackathons per page
 *     responses:
 *       200:
 *         description: Hackathons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hackathons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Hackathon'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
hackathonRouter.get('/hackathons', getHackathons);

/**
 * @openapi
 * /hackathons/active:
 *   get:
 *     tags:
 *       - Hackathon Management
 *     summary: Get active hackathons
 *     description: Retrieve all currently running hackathons
 *     responses:
 *       200:
 *         description: Active hackathons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hackathon'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
hackathonRouter.get('/hackathons/active', getActiveHackathons);

/**
 * @openapi
 * /hackathons/upcoming:
 *   get:
 *     tags:
 *       - Hackathon Management
 *     summary: Get upcoming hackathons
 *     description: Retrieve all upcoming hackathons
 *     responses:
 *       200:
 *         description: Upcoming hackathons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hackathon'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
hackathonRouter.get('/hackathons/upcoming', getUpcomingHackathons);

/**
 * @openapi
 * /hackathons/organizer/{organizerId}:
 *   get:
 *     tags:
 *       - Hackathon Management
 *     summary: Get hackathons by organizer
 *     description: Retrieve all hackathons created by a specific organizer
 *     parameters:
 *       - in: path
 *         name: organizerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organizer user ID
 *     responses:
 *       200:
 *         description: Hackathons retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hackathon'
 *       400:
 *         description: Invalid organizer ID
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
hackathonRouter.get('/hackathons/organizer/:organizerId', getHackathonsByOrganizer);

/**
 * @openapi
 * /hackathons/{id}:
 *   get:
 *     tags:
 *       - Hackathon Management
 *     summary: Get hackathon by ID
 *     description: Retrieve detailed information about a specific hackathon
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hackathon ID
 *     responses:
 *       200:
 *         description: Hackathon retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hackathon'
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
hackathonRouter.get('/hackathons/:id', getHackathonById);

/**
 * @openapi
 * /hackathons:
 *   post:
 *     tags:
 *       - Hackathon Management
 *     summary: Create a new hackathon
 *     description: Create a new hackathon (Admin only)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - rules
 *               - type
 *               - prize
 *               - teamMax
 *               - teamMin
 *               - registrationOpen
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: "ML Hackathon 2025"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *                 example: "A machine learning competition focusing on classification problems"
 *               rules:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 10000
 *                 example: "Teams must submit solutions by the deadline..."
 *               type:
 *                 type: string
 *                 enum: [CLASSIFICATION, REGRESSION, NLP, COMPUTER_VISION, TIME_SERIES, OTHER]
 *                 example: "CLASSIFICATION"
 *               prize:
 *                 type: integer
 *                 minimum: 0
 *                 example: 10000
 *                 description: "Prize amount in dollars"
 *               teamMax:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 example: 4
 *               teamMin:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 example: 2
 *               registrationOpen:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-02-01T00:00:00Z"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-03-01T00:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-03-15T23:59:59Z"
 *     responses:
 *       201:
 *         description: Hackathon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 hackathon:
 *                   $ref: '#/components/schemas/Hackathon'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: array
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
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
hackathonRouter.post('/hackathons', ...adminAuth, createHackathon);

/**
 * @openapi
 * /hackathons/{id}:
 *   put:
 *     tags:
 *       - Hackathon Management
 *     summary: Update a hackathon
 *     description: Update an existing hackathon (Admin or organizer only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hackathon ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *               rules:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 10000
 *               type:
 *                 type: string
 *                 enum: [CLASSIFICATION, REGRESSION, NLP, COMPUTER_VISION, TIME_SERIES, OTHER]
 *               prize:
 *                 type: integer
 *                 minimum: 0
 *                 description: "Prize amount in dollars"
 *               teamMax:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *               teamMin:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *               registrationOpen:
 *                 type: string
 *                 format: date-time
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Hackathon updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 hackathon:
 *                   $ref: '#/components/schemas/Hackathon'
 *       400:
 *         description: Validation failed or invalid hackathon ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: array
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to update this hackathon
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
hackathonRouter.put('/hackathons/:id', auth, updateHackathon);

/**
 * @openapi
 * /hackathons/{id}:
 *   delete:
 *     tags:
 *       - Hackathon Management
 *     summary: Delete a hackathon
 *     description: Delete a hackathon (Admin or organizer only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hackathon ID
 *     responses:
 *       200:
 *         description: Hackathon deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedHackathonId:
 *                   type: integer
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
 *       403:
 *         description: Not authorized to delete this hackathon
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
hackathonRouter.delete('/hackathons/:id', auth, deleteHackathon);

hackathonRouter.post(
  '/hackathons/:hackathonId/resources',
  ...adminAuth,
  resourceUpload.single('file'),
  createHackathonResource
);
hackathonRouter.delete(
  '/hackathons/:hackathonId/resources/:resourceId',
  ...adminAuth,
  deleteHackathonResource
);

hackathonRouter.get('/hackathons/:hackathonId/provided-files', auth, getProvidedFiles);
hackathonRouter.post(
  '/hackathons/:hackathonId/provided-files',
  ...adminAuth,
  providedUpload.single('file'),
  createProvidedFile
);
hackathonRouter.patch('/hackathons/provided-files/:fileId', ...adminAuth, updateProvidedFile);
hackathonRouter.delete('/hackathons/provided-files/:fileId', ...adminAuth, deleteProvidedFile);
hackathonRouter.post(
  '/hackathons/provided-files/:fileId/toggle',
  ...adminAuth,
  toggleProvidedFileVisibility
);

export default hackathonRouter;
