# Employee Vacation Management (React + Node.js + PostgreSQL)

Komplette Web-Anwendung zur Verwaltung von Urlaub, Krankheit und Fortbildung mit Rollen (Admin, Team Lead, Mitarbeiter), Konfliktprüfung, Genehmigungsworkflow und Dashboard.

## Features
- Kalenderansicht mit FullCalendar (Monat/Woche/Jahr) und Farbkennzeichnung
- Abwesenheitsanträge inkl. halber Tage und Vertretung
- Konflikterkennung über Konfliktgruppen
- Rollenbasiertes Genehmigen/Ablehnen
- Mitarbeiterverwaltung (CRUD API)
- Dashboard mit Resturlaub, Krank- und Fortbildungsübersicht
- Benachrichtigungen und Einstellungen
- Deutsche UI
- Responsive Layout mit TailwindCSS

## Projektstruktur
- `frontend/` React + TypeScript + Tailwind + FullCalendar
- `backend/` Express + TypeScript + Prisma
- `prisma/` Schema + Seed
- `docs/` API-Dokumentation

## Voraussetzungen
- Node.js 20+
- PostgreSQL 14+

## Setup
1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
2. Umgebungsvariablen setzen:
   ```bash
   cp .env.example .env
   ```
3. Prisma Client generieren, Migrationen ausführen, Seeds laden:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate -- --name init
   npm run prisma:seed
   ```
4. Entwicklung starten:
   ```bash
   npm run dev
   ```
5. URLs:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:4000`

## Seed-Accounts
Passwort für alle: `Passwort123!`
- `admin@firma.de` (Admin)
- `teamlead@firma.de` (Team Lead)
- `eva@firma.de` (Mitarbeiter)

## Export-Hinweis
CSV/PDF-Export ist über API erweiterbar; die Strukturen für Statistikdaten liegen in `/api/dashboard/stats` vor.
