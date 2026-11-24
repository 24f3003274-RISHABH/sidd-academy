import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../utils/apiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
export const NOTES_UPLOAD_DIR = path.join(UPLOADS_ROOT, 'notes');
export const IMAGES_UPLOAD_DIR = path.join(UPLOADS_ROOT, 'images');

// Memory storage avoids ephemeral disk failures on Render / serverless deployments
// and lets controllers persist binaries directly into PostgreSQL (BYTEA) or cloud storage.
const memoryStorage = multer.memoryStorage();

const pdfFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const isPdfMime =
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/x-pdf' ||
    file.mimetype === 'application/octet-stream';
  const isPdfExt = !ext || ext === '.pdf';
  if (isPdfMime && isPdfExt) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF files (.pdf) are allowed.', 400), false);
  }
};

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes((file.mimetype || '').toLowerCase())) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, and WebP images are allowed.', 400), false);
  }
};

export const uploadPDF = multer({
  storage: memoryStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit
});

export const uploadImage = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});
