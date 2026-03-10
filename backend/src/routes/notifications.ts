import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AuthRequest } from '../types.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  const notifications = await prisma.notification.findMany({ where: { userId: req.user!.userId }, orderBy: { createdAt: 'desc' } });
  res.json(notifications);
});

router.patch('/:id/read', async (req: AuthRequest, res) => {
  await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user!.userId }, data: { read: true } });
  const note = await prisma.notification.findUnique({ where: { id: req.params.id } });
  res.json(note);
});

export default router;
