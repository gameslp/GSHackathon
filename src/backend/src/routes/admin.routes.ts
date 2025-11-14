import { Router } from 'express';
import {
  getUsers,
  updateUserRole,
  deleteUser,
} from '../controllers/admin.controller';
import {
  getHackathons,
  getHackathonById,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  getHackathonTeams,
  getTeamDetails,
  acceptTeam,
  rejectTeam,
} from '../controllers/hackathon.controller';
import { auth } from '../middleware/auth';
import { requireRole } from '../middleware/requireRole';
import { Role } from '../generated/prisma/enums';

const adminRouter = Router();

// All admin routes require authentication and admin role
const adminAuth = [auth, requireRole([Role.ADMIN])];

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all users with pagination
 *     description: Retrieve a paginated list of all users (Admin only)
 *     security:
 *       - cookieAuth: []
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
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserWithDetails'
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
adminRouter.get('/admin/users', ...adminAuth, getUsers);

/**
 * @openapi
 * /admin/users/{id}/role:
 *   patch:
 *     tags:
 *       - Admin
 *     summary: Update user role
 *     description: Change a user's role (Admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, JUDGE, PARTICIPANT]
 *                 description: New role for the user
 *     responses:
 *       200:
 *         description: User role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/UserWithDetails'
 *       400:
 *         description: Invalid user ID or role
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
 *         description: User not found
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
adminRouter.patch('/admin/users/:id/role', ...adminAuth, updateUserRole);

/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete user
 *     description: Delete a user from the system (Admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedUserId:
 *                   type: integer
 *       400:
 *         description: Invalid user ID or attempting to delete own account
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
 *         description: User not found
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
adminRouter.delete('/admin/users/:id', ...adminAuth, deleteUser);

// Hackathon Management Routes

/**
 * @openapi
 * /admin/hackathons:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get all hackathons
 *     description: Retrieve paginated list of all hackathons (Admin only)
 *     security:
 *       - cookieAuth: []
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
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
adminRouter.get('/admin/hackathons', ...adminAuth, getHackathons);

/**
 * @openapi
 * /admin/hackathons/{id}:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get hackathon details
 *     description: Retrieve detailed information about a specific hackathon with teams (Admin only)
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
 *         description: Hackathon retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hackathon'
 *       400:
 *         description: Invalid hackathon ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Hackathon not found
 *       500:
 *         description: Internal server error
 */
adminRouter.get('/admin/hackathons/:id', ...adminAuth, getHackathonById);

/**
 * @openapi
 * /admin/hackathons:
 *   post:
 *     tags:
 *       - Admin
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
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 */
adminRouter.post('/admin/hackathons', ...adminAuth, createHackathon);

/**
 * @openapi
 * /admin/hackathons/{id}:
 *   put:
 *     tags:
 *       - Admin
 *     summary: Update a hackathon
 *     description: Update an existing hackathon (Admin only)
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
 *       400:
 *         description: Validation failed or invalid hackathon ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Hackathon not found
 *       500:
 *         description: Internal server error
 */
adminRouter.put('/admin/hackathons/:id', ...adminAuth, updateHackathon);

/**
 * @openapi
 * /admin/hackathons/{id}:
 *   delete:
 *     tags:
 *       - Admin
 *     summary: Delete a hackathon
 *     description: Delete a hackathon (Admin only)
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
 *       400:
 *         description: Invalid hackathon ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Hackathon not found
 *       500:
 *         description: Internal server error
 */
adminRouter.delete('/admin/hackathons/:id', ...adminAuth, deleteHackathon);

/**
 * @openapi
 * /admin/hackathons/{hackathonId}/teams:
 *   get:
 *     tags:
 *       - Admin
 *     summary: Get teams for a hackathon
 *     description: Retrieve paginated list of teams for a specific hackathon (Admin only)
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
 *       400:
 *         description: Invalid hackathon ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Hackathon not found
 *       500:
 *         description: Internal server error
 */
adminRouter.get('/admin/hackathons/:hackathonId/teams', ...adminAuth, getHackathonTeams);

/**
 * @openapi
 * /admin/teams/{teamId}:
 *   get:
 *     tags:
 *       - Admin
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
 *       400:
 *         description: Invalid team ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Team not found
 *       500:
 *         description: Internal server error
 */
adminRouter.get('/admin/teams/:teamId', ...adminAuth, getTeamDetails);

/**
 * @openapi
 * /admin/teams/{teamId}/accept:
 *   post:
 *     tags:
 *       - Admin
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
 *       400:
 *         description: Invalid team ID or team already accepted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Team not found
 *       500:
 *         description: Internal server error
 */
adminRouter.post('/admin/teams/:teamId/accept', ...adminAuth, acceptTeam);

/**
 * @openapi
 * /admin/teams/{teamId}/reject:
 *   post:
 *     tags:
 *       - Admin
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
 *       400:
 *         description: Invalid team ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Team not found
 *       500:
 *         description: Internal server error
 */
adminRouter.post('/admin/teams/:teamId/reject', ...adminAuth, rejectTeam);

export default adminRouter;
