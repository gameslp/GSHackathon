import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { auth } from '../middleware/auth';
import { ProvidedFileModel } from '../models/providedFile';
import { TeamModel } from '../models/team';
import { PROVIDED_UPLOAD_DIR } from '../lib/uploads';
import { AuthRequest } from '../middleware/auth';

const fileRouter = Router();

fileRouter.get('/uploads/provided/:filename', auth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const fileUrl = `provided/${req.params.filename}`;
    const providedFile = await ProvidedFileModel.findByFileUrl(fileUrl);

    if (!providedFile) {
      return res.status(404).json({ error: 'File not found' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isOrganizer = providedFile.hackathon?.organizerId === req.user.userId;
    const isParticipant = await TeamModel.isUserInHackathon(
      req.user.userId,
      providedFile.hackathonId
    );

    if (!isAdmin && !isOrganizer) {
      if (!providedFile.public || !isParticipant) {
        return res.status(403).json({ error: 'You are not allowed to access this file' });
      }
    }

    const filename = path.basename(providedFile.fileUrl);
    const filePath = path.join(PROVIDED_UPLOAD_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File missing on server' });
    }

    return res.download(filePath, providedFile.name);
  } catch (error) {
    console.error('Provided file download error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default fileRouter;
