import { Link } from 'react-router-dom';
import { PropsWithChildren } from 'react';

export function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen">
      <header className="bg-slate-800 text-white p-4 flex gap-4 overflow-x-auto">
        <Link to="/">Kalender</Link>
        <Link to="/antraege">Anträge</Link>
        <Link to="/mitarbeiter">Mitarbeiter</Link>
        <Link to="/dashboard">Dashboard</Link>
      </header>
      <main className="p-4 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
