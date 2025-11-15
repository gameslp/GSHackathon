import { Router } from 'express';
import { getPlatformStats } from '../controllers/stats.controller';

const statsRouter = Router();

/**
 * @openapi
 * /stats/platform:
 *   get:
 *     tags:
 *       - Statistics
 *     summary: Get platform statistics
 *     description: Returns general platform statistics including active challenges, registered users, total prize pool, and daily submissions
 *     responses:
 *       200:
 *         description: Platform statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     activeChallenges:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: integer
 *                           description: Current number of active hackathons
 *                         trend:
 *                           type: integer
 *                           description: Percentage change compared to last month
 *                     dataScientists:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: integer
 *                           description: Total number of registered users
 *                         trend:
 *                           type: integer
 *                           description: Percentage change compared to last month
 *                     totalPrizePool:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: integer
 *                           description: Sum of prizes from active hackathons (in dollars)
 *                         trend:
 *                           type: integer
 *                           description: Percentage change compared to last month
 *                     submissionsToday:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: integer
 *                           description: Number of submissions today
 *                         trend:
 *                           type: integer
 *                           description: Percentage change compared to yesterday
 *                 generatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when statistics were generated
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
statsRouter.get('/stats/platform', getPlatformStats);

export default statsRouter;
