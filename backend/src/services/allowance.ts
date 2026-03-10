import { AbsenceType, RequestStatus } from '@prisma/client';
import { prisma } from '../prisma.js';

export async function calculateAllowance(userId: string, year: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('Benutzer nicht gefunden');
  }

  const requests = await prisma.absenceRequest.findMany({
    where: {
      userId,
      status: RequestStatus.APPROVED,
      type: AbsenceType.VACATION,
      startDate: { gte: new Date(`${year}-01-01`) },
      endDate: { lte: new Date(`${year}-12-31`) }
    }
  });

  const used = requests.reduce((total, request) => {
    const days = Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 3600 * 24)) + 1;
    return total + (request.halfDay ? 0.5 : days);
  }, 0);

  return {
    total: user.annualAllowance,
    used,
    remaining: Math.max(0, user.annualAllowance - used)
  };
}
