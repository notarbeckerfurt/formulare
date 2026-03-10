import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface DashboardData {
  summary: {
    totalEmployees: number;
    pendingRequests: number;
    onVacationToday: number;
  };
  statistics: Array<{
    userId: string;
    name: string;
    allowanceTotal: number;
    allowanceUsed: number;
    allowanceRemaining: number;
    sickDays: number;
    trainingDays: number;
  }>;
  pendingRequests: Array<{
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    user: { name: string };
  }>;
  availability: {
    inOffice: string[];
    outOfOffice: Array<{ name: string; type: string }>;
  };
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardData>();

  const load = async () => {
    const res = await api.get('/dashboard/stats');
    setStats(res.data);
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await api.patch(`/absences/${id}/status`, { status });
    await load();
  };

  const exportFile = async (format: 'pdf' | 'excel') => {
    const response = await api.get(`/export/${format}?year=2026&type=team&id=alle`, { responseType: 'blob' });
    const fileExtension = format === 'pdf' ? 'pdf' : 'xlsx';
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bericht-${format}.${fileExtension}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (!stats) return <p>Lade Dashboard ...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Übersicht</h2>
      <div className="grid md:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded shadow"><p className="text-sm">Mitarbeitende gesamt</p><p className="text-2xl">{stats.summary.totalEmployees}</p></div>
        <div className="bg-white p-3 rounded shadow"><p className="text-sm">Offene Anträge</p><p className="text-2xl">{stats.summary.pendingRequests}</p></div>
        <div className="bg-white p-3 rounded shadow"><p className="text-sm">Heute im Urlaub</p><p className="text-2xl">{stats.summary.onVacationToday}</p></div>
      </div>

      <div className="bg-white p-3 rounded shadow">
        <h3 className="font-semibold mb-2">Export</h3>
        <div className="flex gap-2">
          <button className="bg-indigo-600 text-white rounded px-3 py-2" onClick={() => exportFile('pdf')}>PDF exportieren</button>
          <button className="bg-emerald-600 text-white rounded px-3 py-2" onClick={() => exportFile('excel')}>Excel exportieren</button>
        </div>
      </div>

      <div className="bg-white p-3 rounded shadow overflow-x-auto">
        <h3 className="font-semibold mb-2">Statistik je Mitarbeitende</h3>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Mitarbeiter</th>
              <th className="py-2">Urlaubstage (gesamt/genommen/rest)</th>
              <th className="py-2">Krankheitstage</th>
              <th className="py-2">Fortbildungstage</th>
            </tr>
          </thead>
          <tbody>
            {stats.statistics.map((row) => (
              <tr key={row.userId} className="border-b last:border-b-0">
                <td className="py-2">{row.name}</td>
                <td className="py-2">{row.allowanceTotal}/{row.allowanceUsed}/{row.allowanceRemaining}</td>
                <td className="py-2">{row.sickDays}</td>
                <td className="py-2">{row.trainingDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-3 rounded shadow">
        <h3 className="font-semibold mb-2">Offene Anträge</h3>
        <div className="space-y-2">
          {stats.pendingRequests.map((request) => (
            <div key={request.id} className="flex items-center justify-between border rounded p-2">
              <span>{request.user.name}: {request.startDate.slice(0, 10)} bis {request.endDate.slice(0, 10)}</span>
              <div className="flex gap-2">
                <button className="bg-green-600 text-white rounded px-2 py-1" onClick={() => decide(request.id, 'APPROVED')}>Schnell genehmigen</button>
                <button className="bg-red-600 text-white rounded px-2 py-1" onClick={() => decide(request.id, 'REJECTED')}>Schnell ablehnen</button>
              </div>
            </div>
          ))}
          {!stats.pendingRequests.length && <p>Keine offenen Anträge.</p>}
        </div>
      </div>

      <div className="bg-white p-3 rounded shadow">
        <h3 className="font-semibold mb-2">Verfügbarkeit heute</h3>
        <p className="font-medium">Im Büro:</p>
        <p>{stats.availability.inOffice.join(', ') || 'Niemand'}</p>
        <p className="font-medium mt-2">Abwesend:</p>
        <ul className="list-disc pl-5">
          {stats.availability.outOfOffice.map((entry) => <li key={entry.name}>{entry.name} ({entry.type})</li>)}
        </ul>
      </div>
    </div>
  );
}
