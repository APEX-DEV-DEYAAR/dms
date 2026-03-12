import multer from 'multer';
import path from 'path';
import { ValidationError } from '../errors/AppError';

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf') {
      return cb(new ValidationError('Only PDF files are allowed'));
    }
    if (file.mimetype !== 'application/pdf') {
      return cb(new ValidationError('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

export function assertPdfSignature(file?: Express.Multer.File) {
  if (!file?.buffer) {
    return;
  }

  const signature = file.buffer.subarray(0, 5).toString('ascii');
  if (signature !== '%PDF-') {
    throw new ValidationError('Uploaded file content is not a valid PDF');
  }
}
