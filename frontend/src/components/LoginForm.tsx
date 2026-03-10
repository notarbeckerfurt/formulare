import { FormEvent, useState } from 'react';
import { api } from '../services/api';

export function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('admin@firma.de');
  const [password, setPassword] = useState('Passwort123!');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin();
    } catch {
      setError('Login fehlgeschlagen');
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded p-6 shadow max-w-md mx-auto mt-10 flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Anmeldung Urlaubsverwaltung</h1>
      {error && <p className="text-red-600">{error}</p>}
      <input className="border rounded p-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail" />
      <input className="border rounded p-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" />
      <button className="bg-blue-600 text-white p-2 rounded">Anmelden</button>
    </form>
  );
}
