import { Router, Response } from 'express';
import { Database } from '../db';
import { authenticateJWT, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/logs - Get audit logs (ADMIN, ARMEIRO)
router.get('/', requireRole(['ADMIN', 'ARMEIRO']), (req: AuthenticatedRequest, res: Response) => {
  const logs = Database.getLogs();
  return res.json(logs);
});

export default router;
