import { Router } from 'express';
import { query, getClient } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** GET /api/v1/users/profile */
router.get('/api/v1/users/profile', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT id, email, name, role, last_login FROM users WHERE id = $1', [req.user.id]);
    const user = r.rows[0];
    if (!user) return res.status(404).json({ detail: 'User profile not found' });
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      last_login: user.last_login ? new Date(user.last_login).toISOString() : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** PUT /api/v1/users/profile */
router.put('/api/v1/users/profile', requireAuth, async (req, res) => {
  const { name } = req.body || {};
  try {
    await query('UPDATE users SET name = COALESCE($1, name) WHERE id = $2', [name ?? null, req.user.id]);
    const r = await query('SELECT id, email, name, role, last_login FROM users WHERE id = $1', [req.user.id]);
    const user = r.rows[0];
    if (!user) return res.status(404).json({ detail: 'User profile not found' });
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      last_login: user.last_login ? new Date(user.last_login).toISOString() : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

export const usersRouter = router;
