import { Router } from 'express';
import { AbsenceType, RequestStatus, Role } from '@prisma/client';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { calculateAllowance } from '../services/allowance.js';

const router = Router();
router.use(requireAuth, requireRole([Role.ADMIN, Role.TEAM_LEAD]));

router.get('/stats', async (_req, res) => {
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(`${currentYear}-01-01`);
  const yearEnd = new Date(`${currentYear}-12-31`);

  const users = await prisma.user.findMany({
    include: {
      requests: {
        where: {
          startDate: { gte: yearStart, lte: yearEnd },
          status: { in: [RequestStatus.APPROVED, RequestStatus.PENDING] }
        }
      }
    }
  });

  const statistics = await Promise.all(users.map(async (user) => {
    const allowance = await calculateAllowance(user.id, currentYear);
    const approvedRequests = user.requests.filter((request) => request.status === RequestStatus.APPROVED);

    const sickDays = approvedRequests.filter((request) => request.type === AbsenceType.SICK).length;
    const trainingDays = approvedRequests.filter((request) => request.type === AbsenceType.TRAINING).length;

    return {
      userId: user.id,
      name: user.name,
      allowanceTotal: allowance.total,
      allowanceUsed: allowance.used,
      allowanceRemaining: allowance.remaining,
      sickDays,
      trainingDays
    };
  }));

  const pendingRequests = await prisma.absenceRequest.findMany({
    where: { status: RequestStatus.PENDING },
    include: { user: true },
    orderBy: { startDate: 'asc' }
  });

  const todayRequests = await prisma.absenceRequest.findMany({
    where: {
      status: RequestStatus.APPROVED,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() }
    },
    include: { user: true }
  });

  const outUserIds = new Set(todayRequests.map((request) => request.userId));
  const inOffice = users.filter((user) => !outUserIds.has(user.id)).map((user) => user.name);

  const outOfOffice = todayRequests.map((request) => ({
    name: request.user.name,
    type: request.type
  }));

  return res.json({
    summary: {
      totalEmployees: users.length,
      pendingRequests: pendingRequests.length,
      onVacationToday: todayRequests.filter((request) => request.type === AbsenceType.VACATION).length
    },
    statistics,
    pendingRequests,
    availability: {
      inOffice,
      outOfOffice
    }
  });
});

export default router;
