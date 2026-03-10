import { PrismaClient, Role, AbsenceType, RequestStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getHolidaysForState } from '../backend/src/services/holidays.js';

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

  const [it, hr, vertriebDept, finanzenDept] = await Promise.all([
    prisma.department.create({ data: { name: 'IT' } }),
    prisma.department.create({ data: { name: 'HR' } }),
    prisma.department.create({ data: { name: 'Vertrieb' } }),
    prisma.department.create({ data: { name: 'Finanzen' } })
  ]);

  const [devTeam, opsTeam, salesTeam, accountingTeam] = await Promise.all([
    prisma.team.create({ data: { name: 'Entwicklung', departmentId: it.id } }),
    prisma.team.create({ data: { name: 'Operations', departmentId: hr.id } }),
    prisma.team.create({ data: { name: 'Vertrieb', departmentId: vertriebDept.id } }),
    prisma.team.create({ data: { name: 'Buchhaltung', departmentId: finanzenDept.id } })
  ]);

  const password = await bcrypt.hash('Passwort123!', 10);

  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Anna Schneider', email: 'anna.schneider@firma.de', password, role: Role.ADMIN, teamId: devTeam.id, bundesland: 'BY', annualAllowance: 30, hireDate: new Date('2017-03-15') } }),
    prisma.user.create({ data: { name: 'Lukas Weber', email: 'lukas.weber@firma.de', password, role: Role.TEAM_LEAD, teamId: devTeam.id, bundesland: 'BY', annualAllowance: 30, hireDate: new Date('2018-07-02') } }),
    prisma.user.create({ data: { name: 'Sophie Neumann', email: 'sophie.neumann@firma.de', password, role: Role.TEAM_LEAD, teamId: opsTeam.id, bundesland: 'BY', annualAllowance: 29, hireDate: new Date('2019-01-10') } }),
    prisma.user.create({ data: { name: 'Felix Hartmann', email: 'felix.hartmann@firma.de', password, role: Role.TEAM_LEAD, teamId: salesTeam.id, bundesland: 'BY', annualAllowance: 30, hireDate: new Date('2020-09-01') } }),
    prisma.user.create({ data: { name: 'Miriam Krüger', email: 'miriam.krueger@firma.de', password, role: Role.EMPLOYEE, teamId: devTeam.id, bundesland: 'BY', annualAllowance: 28, hireDate: new Date('2021-04-12') } }),
    prisma.user.create({ data: { name: 'Daniel König', email: 'daniel.koenig@firma.de', password, role: Role.EMPLOYEE, teamId: devTeam.id, bundesland: 'BY', annualAllowance: 29, hireDate: new Date('2022-06-20') } }),
    prisma.user.create({ data: { name: 'Jana Wolf', email: 'jana.wolf@firma.de', password, role: Role.EMPLOYEE, teamId: opsTeam.id, bundesland: 'BY', annualAllowance: 28, hireDate: new Date('2023-02-01') } }),
    prisma.user.create({ data: { name: 'Tobias Beck', email: 'tobias.beck@firma.de', password, role: Role.EMPLOYEE, teamId: opsTeam.id, bundesland: 'BY', annualAllowance: 30, hireDate: new Date('2020-11-16') } }),
    prisma.user.create({ data: { name: 'Nina Albrecht', email: 'nina.albrecht@firma.de', password, role: Role.EMPLOYEE, teamId: salesTeam.id, bundesland: 'BY', annualAllowance: 29, hireDate: new Date('2021-08-05') } }),
    prisma.user.create({ data: { name: 'Paul Dietrich', email: 'paul.dietrich@firma.de', password, role: Role.EMPLOYEE, teamId: salesTeam.id, bundesland: 'BY', annualAllowance: 28, hireDate: new Date('2024-01-15') } }),
    prisma.user.create({ data: { name: 'Katharina Bauer', email: 'katharina.bauer@firma.de', password, role: Role.EMPLOYEE, teamId: accountingTeam.id, bundesland: 'BY', annualAllowance: 30, hireDate: new Date('2018-12-01') } }),
    prisma.user.create({ data: { name: 'Emre Yilmaz', email: 'emre.yilmaz@firma.de', password, role: Role.EMPLOYEE, teamId: accountingTeam.id, bundesland: 'BY', annualAllowance: 29, hireDate: new Date('2022-09-01') } })
  ]);

  const devCore = await prisma.conflictGroup.create({ data: { name: 'Schlüsselpersonal Entwicklung' } });
  const salesCore = await prisma.conflictGroup.create({ data: { name: 'Schlüsselpersonal Vertrieb' } });

  await prisma.conflictGroupMember.createMany({
    data: [
      { conflictGroupId: devCore.id, userId: users[1].id },
      { conflictGroupId: devCore.id, userId: users[4].id },
      { conflictGroupId: devCore.id, userId: users[5].id },
      { conflictGroupId: salesCore.id, userId: users[3].id },
      { conflictGroupId: salesCore.id, userId: users[8].id }
    ]
  });

  await prisma.absenceRequest.createMany({
    data: [
      { userId: users[4].id, type: AbsenceType.VACATION, startDate: new Date('2026-02-16'), endDate: new Date('2026-02-20'), status: RequestStatus.APPROVED, halfDay: false, substituteId: users[5].id, approvedById: users[1].id, comment: 'Winterurlaub' },
      { userId: users[6].id, type: AbsenceType.SICK, startDate: new Date('2026-03-02'), endDate: new Date('2026-03-04'), status: RequestStatus.APPROVED, halfDay: false, substituteId: users[7].id, approvedById: users[2].id, comment: 'Grippaler Infekt' },
      { userId: users[8].id, type: AbsenceType.TRAINING, startDate: new Date('2026-04-20'), endDate: new Date('2026-04-22'), status: RequestStatus.APPROVED, halfDay: false, substituteId: users[9].id, approvedById: users[3].id, comment: 'Verhandlungstraining' },
      { userId: users[9].id, type: AbsenceType.VACATION, startDate: new Date('2026-05-18'), endDate: new Date('2026-05-22'), status: RequestStatus.PENDING, halfDay: false, substituteId: users[8].id, comment: 'Familienurlaub' },
      { userId: users[10].id, type: AbsenceType.VACATION, startDate: new Date('2026-08-10'), endDate: new Date('2026-08-14'), status: RequestStatus.PENDING, halfDay: false, substituteId: users[11].id, comment: 'Sommerurlaub' },
      { userId: users[5].id, type: AbsenceType.TRAINING, startDate: new Date('2026-09-14'), endDate: new Date('2026-09-15'), status: RequestStatus.APPROVED, halfDay: false, substituteId: users[4].id, approvedById: users[1].id, comment: 'TypeScript Workshop' }
    ]
  });

  await prisma.publicHoliday.createMany({
    data: getHolidaysForState('BY').map((holiday) => ({
      date: new Date(holiday.date),
      name: holiday.name,
      bundesland: 'BY'
    }))
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
