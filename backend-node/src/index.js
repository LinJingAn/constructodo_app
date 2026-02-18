import 'dotenv/config';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { checkDatabaseHealth, ensureTables } from './db.js';
import { attachSocketHandlers } from './socket.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { entitiesRouter } from './routes/entities.js';
import { settingsRouter } from './routes/settings.js';
import { storageRouter } from './routes/storage.js';
import { aihubRouter } from './routes/aihub.js';
import { chatRouter } from './routes/chat.js';
import { balanceRouter } from './routes/balance.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8000;
const DB_OPTIONAL = process.env.CONSTRUCTODO_DB_OPTIONAL === '1';

const frontendDist = path.resolve(
  process.env.FRONTEND_DIST || path.join(__dirname, '..', '..', 'frontend', 'dist')
);
const serveFrontend = fs.existsSync(frontendDist);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.use(healthRouter);
app.use(authRouter);
app.use(usersRouter);
app.use(entitiesRouter);
app.use(settingsRouter);
app.use(storageRouter);
app.use(aihubRouter);
app.use(chatRouter);
app.use(balanceRouter);

if (serveFrontend) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => err && next(err));
  });
  console.log('Serving frontend from', frontendDist);
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'Construtodo Node backend is running' });
  });
}

app.use((req, res) => {
  res.status(404).json({ detail: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ detail: err.message || 'Internal server error' });
});

async function start() {
  const dbOk = await checkDatabaseHealth();
  if (!dbOk) {
    if (DB_OPTIONAL) {
      console.warn('Database connection failed; starting without DB (CONSTRUCTODO_DB_OPTIONAL=1).');
    } else {
      console.error('Database connection failed. Set CONSTRUCTODO_DB_OPTIONAL=1 to start anyway.');
      process.exit(1);
    }
  } else {
    console.log('Database connected.');
    try {
      await ensureTables();
      console.log('Tables ready.');
    } catch (e) {
      console.warn('ensureTables:', e.message);
    }
  }
  const server = http.createServer(app);
  attachSocketHandlers(server);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
