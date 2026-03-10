import { Router } from 'express';
import { AbsenceType, RequestStatus, Role } from '@prisma/client';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { calculateAllowance } from '../services/allowance.js';

const router = Router();
router.use(requireAuth, requireRole([Role.ADMIN, Role.TEAM_LEAD]));

router.get('/stats', async (_req, res) => {
  const currentYear = new Date().getFullYear();
  const users = await prisma.user.findMany();

  const allowance = await Promise.all(users.map(async (u) => ({ userId: u.id, name: u.name, ...(await calculateAllowance(u.id, currentYear)) })));
  const sick = await prisma.absenceRequest.groupBy({ by: ['userId'], where: { type: AbsenceType.SICK, startDate: { gte: new Date(`${currentYear}-01-01`) } }, _count: true });
  const training = await prisma.absenceRequest.groupBy({ by: ['userId'], where: { type: AbsenceType.TRAINING, startDate: { gte: new Date(`${currentYear}-01-01`) } }, _count: true });
  const pending = await prisma.absenceRequest.count({ where: { status: RequestStatus.PENDING } });

  return res.json({ allowance, sick, training, pending });
});

export default router;
