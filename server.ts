import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { authMiddleware } from './server/middleware/auth.js';
import authRoutes from './server/routes/auth.js';
import childrenRoutes from './server/routes/children.js';
import parentsRoutes from './server/routes/parents.js';
import attendanceRoutes from './server/routes/attendance.js';
import paymentsRoutes from './server/routes/payments.js';
import expensesRoutes from './server/routes/expenses.js';
import employeesRoutes from './server/routes/employees.js';
import groupsRoutes from './server/routes/groups.js';
import reportsRoutes from './server/routes/reports.js';
import backupRoutes from './server/routes/backup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Body parser & CORS
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global authentication middleware
app.use(authMiddleware);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/parents', parentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/backup', backupRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Crèche Manager DZ API',
    timestamp: new Date().toISOString()
  });
});

// Production static file serving or Dev Vite mounting
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Crèche Manager DZ server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
