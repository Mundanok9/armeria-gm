import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import authRoutes from './server/routes/auth';
import userRoutes from './server/routes/users';
import firearmRoutes from './server/routes/firearms';
import agendamentoRoutes from './server/routes/agendamentos';
import logRoutes from './server/routes/logs';
import systemRoutes from './server/routes/system';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/firearms', firearmRoutes);
  app.use('/api/agendamentos', agendamentoRoutes);
  app.use('/api/logs', logRoutes);
  app.use('/api/system', systemRoutes);

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ARMERIA GM API', timestamp: new Date().toISOString() });
  });

  // Serve static files in production or Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ARMERIA GM] Servidor rodando na porta http://0.0.0.0:${PORT}`);
  });
}

startServer();
