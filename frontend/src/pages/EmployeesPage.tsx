import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => { api.get('/employees').then((res) => setEmployees(res.data)); }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Mitarbeiterverwaltung</h2>
      <div className="grid md:grid-cols-2 gap-3">
        {employees.map((employee) => (
          <div key={employee.id} className="bg-white p-3 rounded shadow">
            <p className="font-semibold">{employee.name}</p>
            <p>{employee.email}</p>
            <p>Rolle: {employee.role}</p>
            <p>Urlaubstage/Jahr: {employee.annualAllowance}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
