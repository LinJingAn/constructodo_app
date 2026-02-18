import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getIO } from '../socket.js';

const router = Router();

/** Check if the current user can access chat for this project (owner or has a quote) */
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

/**
 * GET /api/v1/chat/projects/:projectId/messages
 * List messages with read status. Returns last_read_at for current user and read_by per message.
 */
router.get('/api/v1/chat/projects/:projectId/messages', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (Number.isNaN(projectId)) return res.status(400).json({ detail: 'Invalid project id' });
  try {
    const allowed = await canAccessProjectChat(req.user.id, projectId);
    if (!allowed) return res.status(403).json({ detail: 'No tienes acceso al chat de este proyecto' });
    const result = await query(
      `SELECT m.id, m.project_id, m.user_id, m.body, m.created_at, up.full_name AS sender_name
       FROM chat_messages m
       LEFT JOIN user_profiles up ON up.user_id = m.user_id
       WHERE m.project_id = $1
       ORDER BY m.created_at ASC`,
      [projectId]
    );
    const reads = await query(
      'SELECT user_id, last_read_at FROM chat_project_reads WHERE project_id = $1',
      [projectId]
    );
    const readAtByUser = {};
    for (const r of reads.rows) {
      readAtByUser[r.user_id] = r.last_read_at instanceof Date ? r.last_read_at.getTime() : new Date(r.last_read_at).getTime();
    }
    const myLastRead = readAtByUser[req.user.id];
    const items = result.rows.map((row) => {
      const created = row.created_at instanceof Date ? row.created_at.getTime() : new Date(row.created_at).getTime();
      const readBy = Object.keys(readAtByUser).filter(
        (uid) => uid !== row.user_id && readAtByUser[uid] >= created
      );
      const obj = {
        id: row.id,
        project_id: row.project_id,
        user_id: row.user_id,
        body: row.body,
        created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        sender_name: row.sender_name ?? null,
        read_by: readBy,
      };
      return obj;
    });
    res.json({
      items,
      total: items.length,
      last_read_at: myLastRead ? new Date(myLastRead).toISOString() : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/**
 * POST /api/v1/chat/projects/:projectId/read
 * Mark project chat as read for the current user (updates last_read_at to now).
 */
router.post('/api/v1/chat/projects/:projectId/read', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (Number.isNaN(projectId)) return res.status(400).json({ detail: 'Invalid project id' });
  try {
    const allowed = await canAccessProjectChat(req.user.id, projectId);
    if (!allowed) return res.status(403).json({ detail: 'No tienes acceso al chat de este proyecto' });
    await query(
      `INSERT INTO chat_project_reads (project_id, user_id, last_read_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (project_id, user_id) DO UPDATE SET last_read_at = NOW()`,
      [projectId, req.user.id]
    );
    const io = getIO();
    if (io) io.to(`project:${projectId}`).emit('chat:read', { user_id: req.user.id, project_id: projectId, last_read_at: new Date().toISOString() });
    res.json({ ok: true, last_read_at: new Date().toISOString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/**
 * GET /api/v1/chat/inbox
 * List all conversations (projects) the user can chat in, with participants and last message.
 */
router.get('/api/v1/chat/inbox', requireAuth, async (req, res) => {
  try {
    const projectIds = await query(
      `SELECT DISTINCT project_id FROM (
        SELECT id AS project_id FROM project_requests WHERE user_id = $1
        UNION
        SELECT project_id FROM quotes WHERE user_id = $1
      ) AS p`,
      [req.user.id]
    );
    const items = [];
    for (const row of projectIds.rows) {
      const projectId = row.project_id;
      const titleRow = await query('SELECT title, user_id AS owner_id FROM project_requests WHERE id = $1', [projectId]);
      const projectTitle = titleRow.rows[0]?.title ?? null;
      const ownerId = titleRow.rows[0]?.owner_id ?? null;

      const quoteSenders = await query('SELECT DISTINCT user_id FROM quotes WHERE project_id = $1', [projectId]);
      const participantIds = new Set([ownerId, ...quoteSenders.rows.map((r) => r.user_id)].filter(Boolean));
      participantIds.delete(req.user.id);
      const participants = [];
      for (const uid of participantIds) {
        const nameRow = await query('SELECT full_name FROM user_profiles WHERE user_id = $1', [uid]);
        participants.push({
          user_id: uid,
          full_name: nameRow.rows[0]?.full_name ?? null,
        });
      }

      const lastMsg = await query(
        `SELECT body, created_at FROM chat_messages WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [projectId]
      );
      const lastMessage = lastMsg.rows[0]
        ? {
            body: lastMsg.rows[0].body,
            created_at: lastMsg.rows[0].created_at instanceof Date ? lastMsg.rows[0].created_at.toISOString() : lastMsg.rows[0].created_at,
          }
        : null;

      const readRow = await query(
        'SELECT last_read_at FROM chat_project_reads WHERE project_id = $1 AND user_id = $2',
        [projectId, req.user.id]
      );
      const lastRead = readRow.rows[0]?.last_read_at;
      const countResult = await query(
        lastRead
          ? 'SELECT COUNT(*)::int AS c FROM chat_messages WHERE project_id = $1 AND created_at > $2'
          : 'SELECT COUNT(*)::int AS c FROM chat_messages WHERE project_id = $1',
        lastRead ? [projectId, lastRead] : [projectId]
      );
      const unread_count = countResult.rows[0]?.c ?? 0;

      const is_owner = req.user.id === ownerId;
      items.push({
        project_id: projectId,
        project_title: projectTitle,
        participants,
        last_message: lastMessage,
        unread_count,
        is_owner,
      });
    }
    items.sort((a, b) => {
      const aTime = a.last_message?.created_at ? new Date(a.last_message.created_at).getTime() : 0;
      const bTime = b.last_message?.created_at ? new Date(b.last_message.created_at).getTime() : 0;
      return bTime - aTime;
    });
    res.json({ items, total: items.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/**
 * GET /api/v1/chat/unread
 * List projects with unread message count for the current user.
 */
router.get('/api/v1/chat/unread', requireAuth, async (req, res) => {
  try {
    const projectIds = await query(
      `SELECT DISTINCT project_id FROM (
        SELECT id AS project_id FROM project_requests WHERE user_id = $1
        UNION
        SELECT project_id FROM quotes WHERE user_id = $1
      ) AS p`,
      [req.user.id]
    );
    const out = [];
    for (const row of projectIds.rows) {
      const projectId = row.project_id;
      const readRow = await query(
        'SELECT last_read_at FROM chat_project_reads WHERE project_id = $1 AND user_id = $2',
        [projectId, req.user.id]
      );
      const lastRead = readRow.rows[0]?.last_read_at;
      const countResult = await query(
        lastRead
          ? 'SELECT COUNT(*)::int AS c FROM chat_messages WHERE project_id = $1 AND created_at > $2'
          : 'SELECT COUNT(*)::int AS c FROM chat_messages WHERE project_id = $1',
        lastRead ? [projectId, lastRead] : [projectId]
      );
      const unreadCount = countResult.rows[0]?.c ?? 0;
      if (unreadCount > 0) {
        const titleRow = await query('SELECT title FROM project_requests WHERE id = $1', [projectId]);
        out.push({
          project_id: projectId,
          unread_count: unreadCount,
          project_title: titleRow.rows[0]?.title ?? null,
        });
      }
    }
    res.json({ items: out, total: out.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/**
 * POST /api/v1/chat/projects/:projectId/messages
 * Send a message. User must be project owner or have sent a quote.
 */
router.post('/api/v1/chat/projects/:projectId/messages', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (Number.isNaN(projectId)) return res.status(400).json({ detail: 'Invalid project id' });
  const body = req.body?.body ?? req.body?.content ?? req.body?.data?.body ?? req.body?.data?.content;
  const trimmed = typeof body === 'string' ? body.trim() : '';
  if (!trimmed) return res.status(400).json({ detail: 'Message body is required' });
  try {
    const allowed = await canAccessProjectChat(req.user.id, projectId);
    if (!allowed) return res.status(403).json({ detail: 'No tienes acceso al chat de este proyecto' });
    const insert = await query(
      `INSERT INTO chat_messages (project_id, user_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, project_id, user_id, body, created_at`,
      [projectId, req.user.id, trimmed]
    );
    const row = insert.rows[0];
    const nameResult = await query(
      'SELECT full_name FROM user_profiles WHERE user_id = $1',
      [req.user.id]
    );
    const sender_name = nameResult.rows[0]?.full_name ?? null;
    const out = {
      id: row.id,
      project_id: row.project_id,
      user_id: row.user_id,
      body: row.body,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      sender_name,
      read_by: [],
    };
    const io = getIO();
    if (io) io.to(`project:${projectId}`).emit('chat:message', out);
    res.status(201).json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

export const chatRouter = router;
