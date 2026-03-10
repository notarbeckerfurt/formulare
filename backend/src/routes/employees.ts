import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({ include: { team: { include: { department: true } } } });
  return res.json(users);
});

router.post('/', requireRole([Role.ADMIN]), async (req, res) => {
  const password = await bcrypt.hash(req.body.password || 'Passwort123!', 10);
  const user = await prisma.user.create({ data: { ...req.body, password } });
  return res.status(201).json(user);
});

router.put('/:id', requireRole([Role.ADMIN]), async (req, res) => {
  const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body });
  return res.json(user);
});

router.delete('/:id', requireRole([Role.ADMIN]), async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

export default router;
