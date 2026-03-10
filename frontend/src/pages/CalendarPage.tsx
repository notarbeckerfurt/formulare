import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { AbsenceRequest, Team, User } from '../types';

const colorMap = { VACATION: '#16a34a', SICK: '#dc2626', TRAINING: '#2563eb', HOLIDAY: '#9ca3af' };
const labelMap = { VACATION: 'Urlaub', SICK: 'Krank', TRAINING: 'Fortbildung' };

interface Holiday {
  id: string;
  date: string;
  name: string;
}

export function CalendarPage() {
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('alle');
  const [form, setForm] = useState({ type: 'VACATION', startDate: '', endDate: '', halfDay: false, substituteId: '' });
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [r, e, t, h] = await Promise.all([api.get('/absences'), api.get('/employees'), api.get('/meta/teams'), api.get('/meta/holidays?bundesland=BY')]);
    setRequests(r.data);
    setEmployees(e.data);
    setTeams(t.data);
    setHolidays(h.data);
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

  const filteredRequests = useMemo(() => {
    if (selectedTeam === 'alle') {
      return requests;
    }
    return requests.filter((request) => request.user?.teamId === selectedTeam);
  }, [requests, selectedTeam]);

  const events = [
    ...filteredRequests.map((request) => ({
      id: request.id,
      title: `${request.user?.name || 'Mitarbeiter'} · ${labelMap[request.type]}`,
      start: request.startDate,
      end: request.endDate,
      color: colorMap[request.type],
      extendedProps: request
    })),
    ...holidays.map((holiday) => ({
      id: holiday.id,
      title: holiday.name,
      start: holiday.date,
      end: holiday.date,
      display: 'background' as const,
      color: colorMap.HOLIDAY
    }))
  ];

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
        <select className="border rounded p-2" value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
          <option value="alle">Alle Teams</option>
          {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
        <button className="bg-blue-600 text-white rounded p-2" onClick={create}>Antrag senden</button>
      </div>
      <div className="bg-white p-3 rounded shadow flex flex-wrap gap-4 text-sm">
        <span><span className="inline-block w-3 h-3 mr-2 rounded" style={{ background: colorMap.VACATION }} />Urlaub</span>
        <span><span className="inline-block w-3 h-3 mr-2 rounded" style={{ background: colorMap.SICK }} />Krank</span>
        <span><span className="inline-block w-3 h-3 mr-2 rounded" style={{ background: colorMap.TRAINING }} />Fortbildung</span>
        <span><span className="inline-block w-3 h-3 mr-2 rounded" style={{ background: colorMap.HOLIDAY }} />Feiertag</span>
      </div>
      {msg && <p className="font-medium">{msg}</p>}
      <div className="bg-white p-3 rounded shadow">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,dayGridDay' }}
          initialView="dayGridMonth"
          events={events}
          locale="de"
        />
      </div>
    </div>
  );
}
