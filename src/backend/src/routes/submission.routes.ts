import { Router } from 'express';
import {
  createSubmission,
  submit,
  getSubmission,
  getHackathonSubmissions,
  getMyTeamSubmission,
  scoreSubmission,
} from '../controllers/submission.controller';
import { uploadSubmissionFile } from '../controllers/fileUpload.controller';
import { auth } from '../middleware/auth';

const submissionRouter = Router();

// Create a draft submission for a hackathon
submissionRouter.post('/hackathons/:hackathonId/submissions', auth, createSubmission);

// Submit/finalize a submission (set sendAt)
submissionRouter.post('/hackathons/:hackathonId/submissions/:submissionId/submit', auth, submit);

// Add a file to a submission
// submissionRouter.post('/submissions/:submissionId/files', auth, uploadSubmissionFile);

// Get a specific submission by ID
submissionRouter.get('/submissions/:submissionId', auth, getSubmission);

// Get all submissions for a hackathon (organizer/admin/judge only)
submissionRouter.get('/hackathons/:hackathonId/submissions', auth, getHackathonSubmissions);

// Get current user's team submission for a hackathon
submissionRouter.get('/hackathons/:hackathonId/my-submission', auth, getMyTeamSubmission);

// Score a submission (organizer/admin/judge only)
submissionRouter.post('/submissions/:submissionId/score', auth, scoreSubmission);

export default submissionRouter;
