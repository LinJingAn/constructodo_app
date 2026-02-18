import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET_KEY || '';
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';

let io = null;

export function setIO(serverInstance) {
  io = serverInstance;
}

export function getIO() {
  return io;
}

/** Check if user can access project chat (owner or has a quote) */
async function canAccessProjectChat(userId, projectId) {
  const ownerCheck = await query(
    'SELECT id FROM project_requests WHERE id = $1 AND user_id = $2',
    [projectId, userId]
  );
  if (ownerCheck.rows.length > 0) return true;
  const quoteCheck = await query(
    'SELECT id FROM quotes WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return quoteCheck.rows.length > 0;
}

export function attachSocketHandlers(serverInstance) {
  const sio = new Server(serverInstance, {
    cors: { origin: true, credentials: true },
    path: '/socket.io',
  });

  sio.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  sio.on('connection', (socket) => {
    socket.on('join_project', async (projectId, cb) => {
      const id = parseInt(projectId, 10);
      if (Number.isNaN(id)) {
        if (typeof cb === 'function') cb({ error: 'Invalid project id' });
        return;
      }
      try {
        const allowed = await canAccessProjectChat(socket.userId, id);
        if (!allowed) {
          if (typeof cb === 'function') cb({ error: 'Access denied' });
          return;
        }
        socket.join(`project:${id}`);
        if (typeof cb === 'function') cb({ ok: true });
      } catch (err) {
        if (typeof cb === 'function') cb({ error: err.message });
      }
    });

    socket.on('disconnect', () => {});
  });

  setIO(sio);
  return sio;
}
