export type Role = 'ADMIN' | 'TEAM_LEAD' | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  teamId?: string;
}

export interface AbsenceRequest {
  id: string;
  type: 'VACATION' | 'SICK' | 'TRAINING';
  startDate: string;
  endDate: string;
  halfDay: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  user?: User;
  substitute?: User;
}
