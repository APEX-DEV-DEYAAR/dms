import { Router } from 'express';
import { LetterheadController } from '../controllers/letterhead.controller';
import { authMiddleware } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { uploadMiddleware } from '../middleware/upload';
import { validate } from '../validation';
import { createLetterheadSchema, letterheadFilterSchema, updateLetterheadSchema } from '../validation/schemas';

export function letterheadRoutes(controller: LetterheadController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get('/next-reference', controller.getNextReference);
  router.get('/export', validate(letterheadFilterSchema), controller.export);
  router.get('/', validate(letterheadFilterSchema), controller.getList);
  router.get('/:id', controller.getById);
  router.get('/:id/download', controller.download);
  router.get('/:id/versions', controller.getVersionHistory);

  // Update — only the creator can edit their own letter (enforced in service)
  router.put('/:id',
    authorize('department_user', 'compliance', 'ceo_office', 'admin'),
    uploadMiddleware.single('file'),
    validate(updateLetterheadSchema),
    controller.update
  );

  // Create — all authenticated users can register letters
  router.post('/',
    authorize('department_user', 'admin'),
    uploadMiddleware.single('file'),
    validate(createLetterheadSchema),
    controller.create
  );

  return router;
}
