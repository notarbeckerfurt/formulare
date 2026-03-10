import { Router } from 'express';
import { AbsenceType, RequestStatus, Role } from '@prisma/client';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole([Role.ADMIN, Role.TEAM_LEAD]));

function countDays(start: Date, end: Date) {
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

async function buildRows(year: number, type: 'employee' | 'team', id: string) {
  const users = await prisma.user.findMany({
    where: type === 'employee' ? { id } : id === 'alle' ? {} : { teamId: id },
    include: {
      requests: {
        where: {
          status: RequestStatus.APPROVED,
          startDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) }
        }
      }
    }
  });

  return users.map((user) => {
    const vacationUsed = user.requests.filter((request) => request.type === AbsenceType.VACATION).reduce((sum, request) => sum + countDays(request.startDate, request.endDate), 0);
    const sickDays = user.requests.filter((request) => request.type === AbsenceType.SICK).reduce((sum, request) => sum + countDays(request.startDate, request.endDate), 0);
    const trainingDays = user.requests.filter((request) => request.type === AbsenceType.TRAINING).reduce((sum, request) => sum + countDays(request.startDate, request.endDate), 0);

    return {
      name: user.name,
      vacationUsed,
      sickDays,
      trainingDays,
      remainingAllowance: Math.max(0, user.annualAllowance - vacationUsed)
    };
  });
}

router.get('/pdf', async (req, res) => {
  const year = Number(req.query.year || new Date().getFullYear());
  const type = req.query.type as 'employee' | 'team';
  const id = req.query.id as string;

  if (!id || !['employee', 'team'].includes(type)) {
    return res.status(400).json({ message: 'Ungültige Parameter' });
  }

  const rows = await buildRows(year, type, id);

  const doc = new PDFDocument({ margin: 40 });
  const filename = `bericht-${type}-${year}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  doc.fontSize(18).text(`Abwesenheitsbericht ${year}`);
  doc.moveDown();
  doc.fontSize(12).text('Name | Urlaub (genommen) | Kranktage | Fortbildungstage | Resturlaub');
  doc.moveDown(0.5);

  rows.forEach((row) => {
    doc.text(`${row.name} | ${row.vacationUsed} | ${row.sickDays} | ${row.trainingDays} | ${row.remainingAllowance}`);
  });

  doc.end();
});

router.get('/excel', async (req, res) => {
  const year = Number(req.query.year || new Date().getFullYear());
  const type = req.query.type as 'employee' | 'team';
  const id = req.query.id as string;

  if (!id || !['employee', 'team'].includes(type)) {
    return res.status(400).json({ message: 'Ungültige Parameter' });
  }

  const rows = await buildRows(year, type, id);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Bericht');
  sheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Urlaub genommen', key: 'vacationUsed', width: 20 },
    { header: 'Kranktage', key: 'sickDays', width: 15 },
    { header: 'Fortbildungstage', key: 'trainingDays', width: 20 },
    { header: 'Resturlaub', key: 'remainingAllowance', width: 15 }
  ];

  rows.forEach((row) => sheet.addRow(row));

  const filename = `bericht-${type}-${year}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
});

export default router;
