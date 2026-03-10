export type Role = 'ADMIN' | 'TEAM_LEAD' | 'EMPLOYEE';

export interface Team {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamId?: string;
  annualAllowance?: number;
  team?: Team;
}

export interface AbsenceRequest {
  id: string;
  userId?: string;
  type: 'VACATION' | 'SICK' | 'TRAINING';
  startDate: string;
  endDate: string;
  halfDay: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  user?: User;
  substitute?: User;
}
