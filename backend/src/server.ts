import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import absenceRoutes from './routes/absences.js';
import dashboardRoutes from './routes/dashboard.js';
import metaRoutes from './routes/meta.js';
import notificationRoutes from './routes/notifications.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/notifications', notificationRoutes);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API läuft auf Port ${port}`);
});
