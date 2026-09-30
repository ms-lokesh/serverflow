import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { initWebSocket } from './websocket';
import { initDb } from './db/pool';

// Routers
import authRouter from './routes/auth';
import employeesRouter from './routes/employees';
import tablesRouter from './routes/tables';
import menuRouter from './routes/menu';
import ordersRouter from './routes/orders';
import kotRouter from './routes/kot';
import reportsRouter from './routes/reports';
import syncRouter from './routes/sync';

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server attached to HTTP server
initWebSocket(server);

// Body and Cookie Parsers
app.use(express.json());
app.use(cookieParser());

// CORS & Credentials header handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && origin !== 'null') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  );

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'serveflow-api', timestamp: new Date().toISOString() });
});

// API Route registration
app.use('/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/kot', kotRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/sync', syncRouter);

// Serve compiled React frontend assets from dist/
const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback for non-API client routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/ws')) {
      return next();
    }
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// Global 404 handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` });
});

// Initialize DB and launch server
initDb()
  .then(() => {
    server.listen(config.port, '0.0.0.0', () => {
      console.log(`[ServeFlow API Server] Running on http://0.0.0.0:${config.port}`);
    });
  })
  .catch((err) => {
    console.error('[ServeFlow DB Startup Error]:', err);
    server.listen(config.port, '0.0.0.0', () => {
      console.log(`[ServeFlow API Server] Running on http://0.0.0.0:${config.port} (degraded mode)`);
    });
  });

export { app, server };

