# API Dokumentation

## Auth
- `POST /api/auth/login`

## Mitarbeiter
- `GET /api/employees`
- `POST /api/employees` (Admin)
- `PUT /api/employees/:id` (Admin)
- `DELETE /api/employees/:id` (Admin)

## Abwesenheiten
- `GET /api/absences`
- `POST /api/absences`
- `PATCH /api/absences/:id/status`

## Dashboard
- `GET /api/dashboard/stats`

## Meta
- `GET /api/meta/teams`
- `GET /api/meta/holidays`
- `GET /api/meta/settings`

## Benachrichtigungen
- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
