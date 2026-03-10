import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AbsenceRequest } from '../types';

export function RequestsPage() {
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);

  const load = async () => {
    const { data } = await api.get('/absences');
    setRequests(data);
  };

  useEffect(() => { load(); }, []);

  const decide = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await api.patch(`/absences/${id}/status`, { status });
    load();
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Anträge</h2>
      <div className="space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="bg-white p-3 rounded shadow flex justify-between items-center gap-2">
            <div>
              <p className="font-semibold">{request.user?.name || 'Ich'} - {request.type}</p>
              <p>{request.startDate.slice(0, 10)} bis {request.endDate.slice(0, 10)} | Status: {request.status}</p>
            </div>
            {request.status === 'PENDING' && (
              <div className="flex gap-2">
                <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => decide(request.id, 'APPROVED')}>Genehmigen</button>
                <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => decide(request.id, 'REJECTED')}>Ablehnen</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
