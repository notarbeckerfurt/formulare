import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function DashboardPage() {
  const [stats, setStats] = useState<any>();

  useEffect(() => { api.get('/dashboard/stats').then((res) => setStats(res.data)); }, []);

  if (!stats) return <p>Lade Dashboard ...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
      <div className="grid md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded shadow"><p className="text-sm">Offene Anträge</p><p className="text-2xl">{stats.pending}</p></div>
        <div className="bg-white p-3 rounded shadow"><p className="text-sm">Krankmeldungen</p><p className="text-2xl">{stats.sick.length}</p></div>
        <div className="bg-white p-3 rounded shadow"><p className="text-sm">Fortbildungen</p><p className="text-2xl">{stats.training.length}</p></div>
        <div className="bg-white p-3 rounded shadow"><p className="text-sm">Mitarbeiter</p><p className="text-2xl">{stats.allowance.length}</p></div>
      </div>
      <div className="bg-white p-3 rounded shadow">
        <h3 className="font-semibold mb-2">Resturlaub</h3>
        {stats.allowance.map((entry: any) => <p key={entry.userId}>{entry.name}: {entry.remaining} Tage frei</p>)}
      </div>
    </div>
  );
}
