import { Router } from 'express';
import {
  getSubmissionFileFormats,
  createSubmissionFileFormat,
  updateSubmissionFileFormat,
  deleteSubmissionFileFormat,
  validateSubmissionFile,
} from '../controllers/submissionFileFormat.controller';
import { auth } from '../middleware/auth';

const submissionFileFormatRouter = Router();

/**
 * @openapi
 * /hackathons/{hackathonId}/file-formats:
 *   get:
 *     tags:
 *       - Submission File Formats
 *     summary: Get file format requirements for a hackathon
 *     description: Retrieve all file format requirements for submissions (organizer/admin/participant)
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
 *         description: File formats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   hackathonId:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   extension:
 *                     type: string
 *                   maxSizeKB:
 *                     type: integer
 *                   obligatory:
 *                     type: boolean
 *       400:
 *         description: Invalid hackathon ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to view file formats
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
submissionFileFormatRouter.get('/hackathons/:hackathonId/file-formats', auth, getSubmissionFileFormats);

/**
 * @openapi
 * /hackathons/{hackathonId}/file-formats:
 *   post:
 *     tags:
 *       - Submission File Formats
 *     summary: Create a file format requirement
 *     description: Add a new file format requirement for submissions (organizer/admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: hackathonId
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
 *             required:
 *               - name
 *               - description
 *               - extension
 *               - maxSizeKB
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: "Training Data"
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 example: "CSV file containing the training dataset"
 *               extension:
 *                 type: string
 *                 pattern: ^\.[a-zA-Z0-9]+$
 *                 example: ".csv"
 *               maxSizeKB:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 102400
 *                 example: 51200
 *                 description: Maximum file size in KB (max 100MB)
 *               obligatory:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this file is mandatory
 *     responses:
 *       201:
 *         description: File format created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 format:
 *                   type: object
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
 *       403:
 *         description: Not authorized to add file formats
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
submissionFileFormatRouter.post('/hackathons/:hackathonId/file-formats', auth, createSubmissionFileFormat);

/**
 * @openapi
 * /file-formats/{formatId}:
 *   put:
 *     tags:
 *       - Submission File Formats
 *     summary: Update a file format requirement
 *     description: Update an existing file format requirement (organizer/admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: formatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: File format ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *               extension:
 *                 type: string
 *                 pattern: ^\.[a-zA-Z0-9]+$
 *               maxSizeKB:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 102400
 *               obligatory:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: File format updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 format:
 *                   type: object
 *       400:
 *         description: Validation failed or invalid format ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: array
 *       403:
 *         description: Not authorized to update this format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: File format or hackathon not found
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
submissionFileFormatRouter.put('/file-formats/:formatId', auth, updateSubmissionFileFormat);

/**
 * @openapi
 * /file-formats/{formatId}:
 *   delete:
 *     tags:
 *       - Submission File Formats
 *     summary: Delete a file format requirement
 *     description: Remove a file format requirement (organizer/admin only)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: formatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: File format ID
 *     responses:
 *       200:
 *         description: File format deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedFormatId:
 *                   type: integer
 *       400:
 *         description: Invalid format ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to delete this format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: File format or hackathon not found
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
submissionFileFormatRouter.delete('/file-formats/:formatId', auth, deleteSubmissionFileFormat);

/**
 * @openapi
 * /file-formats/{formatId}/validate:
 *   post:
 *     tags:
 *       - Submission File Formats
 *     summary: Validate a file against format requirements
 *     description: Check if a file meets the format requirements (organizer/admin/participant)
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: formatId
 *         required: true
 *         schema:
 *           type: integer
 *         description: File format ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileSizeKB
 *             properties:
 *               fileName:
 *                 type: string
 *                 example: "training_data.csv"
 *               fileSizeKB:
 *                 type: number
 *                 example: 2048
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid format ID or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to validate files for this hackathon
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Format or hackathon not found
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
submissionFileFormatRouter.post('/file-formats/:formatId/validate', auth, validateSubmissionFile);

export default submissionFileFormatRouter;
