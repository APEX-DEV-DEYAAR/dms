import { Router } from 'express';
import { LetterheadController } from '../controllers/letterhead.controller';
import { authMiddleware } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { uploadMiddleware } from '../middleware/upload';

export function letterheadRoutes(controller: LetterheadController): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get('/next-reference', controller.getNextReference);
  router.get('/export', controller.export);
  router.get('/', controller.getList);
  router.get('/:id/archive', controller.getArchiveInfo);
  router.get('/:id', controller.getById);
  router.get('/:id/download', controller.download);
  router.get('/:id/versions', controller.getVersionHistory);
  
  // Update (edit description and notes)
  router.put('/:id',
    authorize('department_user', 'compliance', 'ceo_office', 'admin'),
    uploadMiddleware.single('file'),
    controller.update
  );
  
  // Archive (admin only)
  router.post('/:id/archive',
    authorize('compliance', 'ceo_office', 'admin'),
    controller.archive
  );
  
  // Unarchive (admin only)
  router.post('/:id/unarchive',
    authorize('compliance', 'ceo_office', 'admin'),
    controller.unarchive
  );
  
  router.post('/',
    authorize('department_user', 'admin'),
    uploadMiddleware.single('file'),
    controller.create
  );

  return router;
}
