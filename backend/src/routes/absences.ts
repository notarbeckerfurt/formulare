import { Router } from 'express';
import { AbsenceType, RequestStatus, Role } from '@prisma/client';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { AuthRequest } from '../types.js';
import { detectConflicts } from '../services/conflicts.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthRequest, res) => {
  if (req.user?.role === Role.ADMIN) {
    const all = await prisma.absenceRequest.findMany({ include: { user: true, substitute: true } });
    return res.json(all);
  }

  if (req.user?.role === Role.TEAM_LEAD) {
    const lead = await prisma.user.findUnique({ where: { id: req.user.userId } });
    const team = await prisma.absenceRequest.findMany({ where: { user: { teamId: lead?.teamId || undefined } }, include: { user: true, substitute: true } });
    return res.json(team);
  }

  const own = await prisma.absenceRequest.findMany({ where: { userId: req.user?.userId }, include: { substitute: true } });
  return res.json(own);
});

router.post('/', async (req: AuthRequest, res) => {
  const { type, startDate, endDate, halfDay, substituteId, comment, overrideConflict } = req.body as {
    type: AbsenceType;
    startDate: string;
    endDate: string;
    halfDay: boolean;
    substituteId: string;
    comment?: string;
    overrideConflict?: boolean;
  };

  if (!Object.values(AbsenceType).includes(type)) {
    return res.status(400).json({ message: 'Ungültiger Typ' });
  }

  const conflicts = type === AbsenceType.VACATION ? await detectConflicts(req.user!.userId, new Date(startDate), new Date(endDate)) : [];
  if (conflicts.length && !overrideConflict && req.user?.role !== Role.ADMIN) {
    return res.status(409).json({ message: 'Konflikt erkannt', conflicts });
  }

  const request = await prisma.absenceRequest.create({
    data: {
      userId: req.user!.userId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      halfDay,
      substituteId,
      comment
    }
  });

  const approvers = await prisma.user.findMany({ where: { OR: [{ role: Role.ADMIN }, { role: Role.TEAM_LEAD }] } });
  await prisma.notification.createMany({
    data: approvers.map((a) => ({ userId: a.id, message: `Neuer Antrag von ${req.user!.userId} wartet auf Freigabe.` }))
  });

  return res.status(201).json({ request, conflicts });
});

router.patch('/:id/status', async (req: AuthRequest, res) => {
  if (req.user!.role !== Role.ADMIN && req.user!.role !== Role.TEAM_LEAD) {
    return res.status(403).json({ message: 'Keine Berechtigung' });
  }

  const { status, comment } = req.body as { status: RequestStatus; comment?: string };
  const updated = await prisma.absenceRequest.update({
    where: { id: req.params.id },
    data: {
      status,
      comment,
      approvedById: req.user!.userId
    }
  });

  await prisma.notification.create({ data: { userId: updated.userId, message: `Ihr Antrag wurde ${status === RequestStatus.APPROVED ? 'genehmigt' : 'abgelehnt'}.` } });

  return res.json(updated);
});

export default router;
