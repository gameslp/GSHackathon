import path from 'node:path';
import fs from 'node:fs';
import { promises as fsPromises } from 'node:fs';
import multer from 'multer';

const projectRoot = process.cwd();
const baseUploadDir =
  process.env.UPLOAD_ROOT && process.env.UPLOAD_ROOT.trim().length > 0
    ? path.resolve(process.env.UPLOAD_ROOT)
    : path.join(projectRoot, 'uploads');

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDir(baseUploadDir);

export const RESOURCE_UPLOAD_DIR = path.join(baseUploadDir, 'resources');
export const PROVIDED_UPLOAD_DIR = path.join(baseUploadDir, 'provided');

ensureDir(RESOURCE_UPLOAD_DIR);
ensureDir(PROVIDED_UPLOAD_DIR);

const sanitizeFileName = (originalName: string) => {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9-_]+/g, '-');
  const safeBase = base.length > 0 ? base : 'file';
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${safeBase}-${uniqueSuffix}${ext}`;
};

const createStorage = (destination: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      cb(null, sanitizeFileName(file.originalname));
    },
  });

export const resourceUpload = multer({
  storage: createStorage(RESOURCE_UPLOAD_DIR),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

export const providedUpload = multer({
  storage: createStorage(PROVIDED_UPLOAD_DIR),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB
  },
});

export const buildResourceUrl = (filename: string) => `/uploads/resources/${filename}`;
export const buildProvidedFileUrl = (filename: string) => `/uploads/provided/${filename}`;

export const deleteUploadedFile = async (directory: string, fileUrl?: string | null) => {
  if (!fileUrl) return;
  const filename = path.basename(fileUrl);
  const filePath = path.join(directory, filename);

  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`Failed to delete uploaded file at ${filePath}`, error);
    }
  }
};
