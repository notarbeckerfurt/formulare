import { AbsenceType, RequestStatus } from '@prisma/client';
import { prisma } from '../prisma.js';

export async function detectConflicts(userId: string, startDate: Date, endDate: Date) {
  const memberships = await prisma.conflictGroupMember.findMany({ where: { userId } });
  const groupIds = memberships.map((m) => m.conflictGroupId);
  if (!groupIds.length) return [];

  const members = await prisma.conflictGroupMember.findMany({
    where: { conflictGroupId: { in: groupIds }, userId: { not: userId } },
    include: { user: true }
  });

  const memberIds = members.map((m) => m.userId);

  const conflicts = await prisma.absenceRequest.findMany({
    where: {
      userId: { in: memberIds },
      type: AbsenceType.VACATION,
      status: { in: [RequestStatus.PENDING, RequestStatus.APPROVED] },
      startDate: { lte: endDate },
      endDate: { gte: startDate }
    },
    include: { user: true }
  });

  return conflicts.map((c) => ({ userId: c.userId, name: c.user.name, startDate: c.startDate, endDate: c.endDate }));
}
