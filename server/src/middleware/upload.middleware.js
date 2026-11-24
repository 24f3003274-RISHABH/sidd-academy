import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { AppError } from '../utils/apiResponse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

export const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
export const NOTES_UPLOAD_DIR = path.join(UPLOADS_ROOT, 'notes');
export const IMAGES_UPLOAD_DIR = path.join(UPLOADS_ROOT, 'images');

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(NOTES_UPLOAD_DIR);
    cb(null, NOTES_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `note-${uniqueSuffix}.pdf`);
  },
});

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDir(IMAGES_UPLOAD_DIR);
    cb(null, IMAGES_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `img-${uniqueSuffix}${ext}`);
  },
});

const pdfFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = !ext || ext === '.pdf';
  if (isPdfMime && isPdfExt) {
    cb(null, true);
  } else {
    cb(new AppError('Only PDF files are allowed.', 400), false);
  }
};

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only JPEG, PNG, WebP images are allowed.', 400), false);
  }
};

export const uploadPDF = multer({ storage: pdfStorage, fileFilter: pdfFilter, limits: { fileSize: 50 * 1024 * 1024 } });
export const uploadImage = multer({ storage: imageStorage, fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
