import { Router } from 'express';
import {
  uploadHackathonResource,
  uploadProvidedFile,
  uploadSubmissionFile,
  upload,
} from '../controllers/fileUpload.controller';
import { auth } from '../middleware/auth';

const fileUploadRouter = Router();

/**
 * @openapi
 * /hackathons/resources/upload:
 *   post:
 *     tags:
 *       - File Upload
 *     summary: Upload a hackathon resource file
 *     description: Upload a resource file for a hackathon (organizer/admin only)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - hackathonId
 *               - file
 *             properties:
 *               hackathonId:
 *                 type: integer
 *                 description: Hackathon ID
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Resource file to upload
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 fileUrl:
 *                   type: string
 *                 fileName:
 *                   type: string
 *                 fileSize:
 *                   type: integer
 *                   description: File size in KB
 *       400:
 *         description: Invalid hackathon ID or no file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to upload resources
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
fileUploadRouter.post(
  '/hackathons/resources/upload',
  auth,
  upload.single('file'),
  uploadHackathonResource
);

/**
 * @openapi
 * /hackathons/provided-files/upload:
 *   post:
 *     tags:
 *       - File Upload
 *     summary: Upload a provided file
 *     description: Upload a file that will be provided to participants (organizer/admin only)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - hackathonId
 *               - file
 *             properties:
 *               hackathonId:
 *                 type: integer
 *                 description: Hackathon ID
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to provide to participants
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 fileUrl:
 *                   type: string
 *                 fileName:
 *                   type: string
 *                 fileSize:
 *                   type: integer
 *                   description: File size in KB
 *       400:
 *         description: Invalid hackathon ID or no file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to upload files
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
fileUploadRouter.post(
  '/hackathons/provided-files/upload',
  auth,
  upload.single('file'),
  uploadProvidedFile
);

/**
 * @openapi
 * /hackathons/submissions/upload:
 *   post:
 *     tags:
 *       - File Upload
 *     summary: Upload a submission file
 *     description: Upload a file for a hackathon submission (participant only)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - hackathonId
 *               - fileFormatId
 *               - file
 *             properties:
 *               hackathonId:
 *                 type: integer
 *                 description: Hackathon ID
 *               fileFormatId:
 *                 type: integer
 *                 description: File format ID to validate against
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Submission file to upload
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 fileFormatId:
 *                   type: integer
 *                 fileUrl:
 *                   type: string
 *                 fileName:
 *                   type: string
 *                 fileSize:
 *                   type: integer
 *                   description: File size in KB
 *       400:
 *         description: Invalid request, file extension/size validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to upload files for this hackathon
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Hackathon or file format not found
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
fileUploadRouter.post(
  '/hackathons/submissions/upload',
  auth,
  upload.single('file'),
  uploadSubmissionFile
);

export default fileUploadRouter;
