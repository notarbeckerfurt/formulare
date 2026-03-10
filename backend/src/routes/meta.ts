import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/teams', async (_req, res) => {
  const teams = await prisma.team.findMany({ include: { department: true, users: true } });
  res.json(teams);
});

router.get('/holidays', async (req, res) => {
  const bundesland = req.query.bundesland as string;
  const holidays = await prisma.publicHoliday.findMany({ where: bundesland ? { bundesland } : {} });
  res.json(holidays);
});

router.get('/settings', async (_req, res) => {
  const settings = await prisma.setting.findMany();
  res.json(settings);
});

export default router;
