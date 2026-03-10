import { useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginForm } from './components/LoginForm';
import { CalendarPage } from './pages/CalendarPage';
import { RequestsPage } from './pages/RequestsPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { DashboardPage } from './pages/DashboardPage';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const isAuthenticated = useMemo(() => Boolean(token), [token]);

  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setToken(localStorage.getItem('token'))} />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<CalendarPage />} />
          <Route path="/antraege" element={<RequestsPage />} />
          <Route path="/mitarbeiter" element={<EmployeesPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
