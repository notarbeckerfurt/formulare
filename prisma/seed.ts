import { PrismaClient, Role, AbsenceType, RequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.notification.deleteMany();
  await prisma.absenceRequest.deleteMany();
  await prisma.conflictGroupMember.deleteMany();
  await prisma.conflictGroup.deleteMany();
  await prisma.publicHoliday.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.department.deleteMany();
  await prisma.setting.deleteMany();

  const it = await prisma.department.create({ data: { name: 'IT' } });
  const hr = await prisma.department.create({ data: { name: 'HR' } });

  const devTeam = await prisma.team.create({ data: { name: 'Entwicklung', departmentId: it.id } });
  const opsTeam = await prisma.team.create({ data: { name: 'Operations', departmentId: hr.id } });

  const password = await bcrypt.hash('Passwort123!', 10);

  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Anna Admin', email: 'admin@firma.de', password, role: Role.ADMIN, teamId: devTeam.id, bundesland: 'BY', annualAllowance: 30, hireDate: new Date('2020-01-10') } }),
    prisma.user.create({ data: { name: 'Tom Teamlead', email: 'teamlead@firma.de', password, role: Role.TEAM_LEAD, teamId: devTeam.id, bundesland: 'BY', annualAllowance: 30, hireDate: new Date('2021-05-01') } }),
    prisma.user.create({ data: { name: 'Eva Employee', email: 'eva@firma.de', password, role: Role.EMPLOYEE, teamId: devTeam.id, bundesland: 'BY', annualAllowance: 30, hireDate: new Date('2022-04-01') } }),
    prisma.user.create({ data: { name: 'Max Mitarbeiter', email: 'max@firma.de', password, role: Role.EMPLOYEE, teamId: opsTeam.id, bundesland: 'BY', annualAllowance: 28, hireDate: new Date('2019-09-15') } }),
    prisma.user.create({ data: { name: 'Lea Learning', email: 'lea@firma.de', password, role: Role.EMPLOYEE, teamId: opsTeam.id, bundesland: 'BY', annualAllowance: 30, hireDate: new Date('2023-02-01') } })
  ]);

  const group = await prisma.conflictGroup.create({ data: { name: 'Schlüsselpersonal' } });
  await prisma.conflictGroupMember.createMany({ data: [{ conflictGroupId: group.id, userId: users[1].id }, { conflictGroupId: group.id, userId: users[2].id }] });

  await prisma.absenceRequest.create({
    data: {
      userId: users[2].id,
      type: AbsenceType.VACATION,
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 2)),
      status: RequestStatus.PENDING,
      halfDay: false,
      substituteId: users[1].id
    }
  });

  await prisma.publicHoliday.createMany({
    data: [
      { date: new Date('2026-01-01'), name: 'Neujahr', bundesland: 'BY' },
      { date: new Date('2026-12-25'), name: '1. Weihnachtstag', bundesland: 'BY' }
    ]
  });

  await prisma.setting.createMany({
    data: [
      { key: 'companyName', value: 'Formulare GmbH' },
      { key: 'defaultVacationDays', value: '30' },
      { key: 'carryoverMax', value: '5' },
      { key: 'carryoverExpiry', value: '03-31' },
      { key: 'bundesland', value: 'BY' }
    ]
  });
}

main().finally(async () => prisma.$disconnect());
