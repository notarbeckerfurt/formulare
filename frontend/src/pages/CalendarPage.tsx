import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AbsenceRequest, User } from '../types';

const colorMap = { VACATION: '#16a34a', SICK: '#dc2626', TRAINING: '#2563eb' };

export function CalendarPage() {
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [form, setForm] = useState({ type: 'VACATION', startDate: '', endDate: '', halfDay: false, substituteId: '' });
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [r, e] = await Promise.all([api.get('/absences'), api.get('/employees')]);
    setRequests(r.data);
    setEmployees(e.data);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await api.post('/absences', form);
      setMsg('Antrag erfolgreich erstellt.');
      await load();
    } catch (error: any) {
      const conflicts = error.response?.data?.conflicts;
      setMsg(conflicts ? `Konflikt mit: ${conflicts.map((c: any) => c.name).join(', ')}` : 'Fehler beim Speichern');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Kalender</h2>
      <div className="grid md:grid-cols-4 gap-3 bg-white p-3 rounded shadow">
        <select className="border rounded p-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="VACATION">Urlaub</option>
          <option value="SICK">Krank</option>
          <option value="TRAINING">Fortbildung</option>
        </select>
        <input className="border rounded p-2" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        <input className="border rounded p-2" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        <select className="border rounded p-2" value={form.substituteId} onChange={(e) => setForm({ ...form, substituteId: e.target.value })}>
          <option value="">Vertretung wählen</option>
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
        </select>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.halfDay} onChange={(e) => setForm({ ...form, halfDay: e.target.checked })} /> Halber Tag</label>
        <button className="bg-blue-600 text-white rounded p-2" onClick={create}>Antrag senden</button>
      </div>
      {msg && <p className="font-medium">{msg}</p>}
      <div className="bg-white p-3 rounded shadow">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,dayGridYear' }}
          initialView="dayGridMonth"
          events={requests.map((request) => ({
            id: request.id,
            title: `${request.user?.name || 'Mitarbeiter'} - ${request.type}`,
            start: request.startDate,
            end: request.endDate,
            color: colorMap[request.type],
            extendedProps: request
          }))}
        />
      </div>
    </div>
  );
}
