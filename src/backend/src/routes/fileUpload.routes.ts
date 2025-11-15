import { Router } from 'express';
import {
  uploadHackathonResource,
  uploadProvidedFile,
  uploadSubmissionFile,
  upload,
} from '../controllers/fileUpload.controller';
import { auth } from '../middleware/auth';

const fileUploadRouter = Router();

// Upload a hackathon resource file (organizer/admin only)
fileUploadRouter.post(
  '/hackathons/resources/upload',
  auth,
  upload.single('file'),
  uploadHackathonResource
);

// Upload a provided file (organizer/admin only)
fileUploadRouter.post(
  '/hackathons/provided-files/upload',
  auth,
  upload.single('file'),
  uploadProvidedFile
);

// Upload a submission file (participant only)
fileUploadRouter.post(
  '/hackathons/submissions/upload',
  auth,
  upload.single('file'),
  uploadSubmissionFile
);

export default fileUploadRouter;
