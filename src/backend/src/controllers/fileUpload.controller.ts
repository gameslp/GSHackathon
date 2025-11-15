import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { SubmissionFileFormatModel } from '../models/submissionFileFormat';
import { HackathonModel } from '../models/hackathon';
import { TeamModel } from '../models/team';
import { buildSubmissionUrl } from '../lib/uploads';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from "os";
import { SubmissionFileModel } from 'src/models/submissionFile';
import { SubmissionModel } from 'src/models/submission';
import { id } from 'zod/v4/locales';

const uploadDir = path.join(__dirname, '../../uploads');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = os.tmpdir();

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({ storage });

// Upload a hackathon resource file
export const uploadHackathonResource = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.body.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if hackathon exists
    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check authorization - only organizer or admin
    const isOrganizer = req.user.userId === hackathon.organizerId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOrganizer && !isAdmin) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Not authorized to upload resources for this hackathon' });
    }

    // Generate file URL
    const fileUrl = `hackathon-resources/${req.file.filename}`;
    await fs.promises.rename(req.file.path, path.join(uploadDir, fileUrl));

    return res.status(200).json({
      message: 'Resource file uploaded successfully',
      fileUrl,
      fileName: req.file.originalname,
      fileSize: Math.round(req.file.size / 1024),
    });
  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Upload hackathon resource error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload a provided file
export const uploadProvidedFile = async (req: AuthRequest, res: Response) => {
  try {
    const hackathonId = parseInt(req.body.hackathonId);

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if hackathon exists
    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Check authorization - only organizer or admin
    const isOrganizer = req.user.userId === hackathon.organizerId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOrganizer && !isAdmin) {
      // Delete the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Not authorized to upload files for this hackathon' });
    }

    // Generate file URL
    const fileUrl = `hackathon-provided/${req.file.filename}`;
    await fs.promises.rename(req.file.path, path.join(uploadDir, fileUrl));

    return res.status(200).json({
      message: 'Provided file uploaded successfully',
      fileUrl,
      fileName: req.file.originalname,
      fileSize: Math.round(req.file.size / 1024),
    });
  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Upload provided file error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload a submission file
export const uploadSubmissionFile = async (req: AuthRequest, res: Response) => {
  try {
    const fileFormatId = parseInt(req.body.fileFormatId);
    const hackathonId = parseInt(req.body.hackathonId);

    if (!fileFormatId || isNaN(fileFormatId)) {
      return res.status(400).json({ error: 'Invalid file format ID' });
    }

    if (!hackathonId || isNaN(hackathonId)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if format exists
    const format = await SubmissionFileFormatModel.findById(fileFormatId);

    if (!format) {
      return res.status(404).json({ error: 'File format not found' });
    }

    // Check if format belongs to the specified hackathon
    if (format.hackathonId !== hackathonId) {
      return res.status(400).json({ error: 'File format does not belong to this hackathon' });
    }

    // Check authorization - user must be in the hackathon
    const hackathon = await HackathonModel.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    const isParticipant = await TeamModel.isUserInHackathon(req.user.userId, hackathonId);

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to upload files for this hackathon' });
    }
  
    const fileSizeKB = req.file.size / 1024;
    const validation = await SubmissionFileFormatModel.validateFileSubmission(
      fileFormatId,
      req.file.originalname,
      fileSizeKB
    );

    if (!validation.valid) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: validation.errors.join(', '),
      });
    }

    // Generate file URL using centralized function
    const fileUrl = buildSubmissionUrl(req.file.filename);

    return res.status(200).json({
      message: 'File uploaded successfully',
      fileFormatId,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: Math.round(fileSizeKB),
    });
  } catch (error) {
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Upload submission file error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
