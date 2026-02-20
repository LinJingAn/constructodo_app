import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { query } from '../db.js';

const router = Router();

/** GET /api/v1/admin/stats - platform counts (admin only) */
router.get('/api/v1/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [usersRes, profilesRes, clientsRes, professionalsRes, projectsRes, quotesRes, reviewsRes] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM users').catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*)::int AS count FROM user_profiles').catch(() => ({ rows: [{ count: 0 }] })),
      query("SELECT COUNT(*)::int AS count FROM user_profiles WHERE user_type = 'client'").catch(() => ({ rows: [{ count: 0 }] })),
      query("SELECT COUNT(*)::int AS count FROM user_profiles WHERE user_type = 'professional'").catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*)::int AS count FROM project_requests').catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*)::int AS count FROM quotes').catch(() => ({ rows: [{ count: 0 }] })),
      query('SELECT COUNT(*)::int AS count FROM reviews').catch(() => ({ rows: [{ count: 0 }] })),
    ]);
    res.json({
      users: usersRes.rows[0]?.count ?? 0,
      profiles: profilesRes.rows[0]?.count ?? 0,
      clients: clientsRes.rows[0]?.count ?? 0,
      professionals: professionalsRes.rows[0]?.count ?? 0,
      project_requests: projectsRes.rows[0]?.count ?? 0,
      quotes: quotesRes.rows[0]?.count ?? 0,
      reviews: reviewsRes.rows[0]?.count ?? 0,
    });
  } catch (e) {
    console.error('admin/stats', e);
    res.status(500).json({ detail: e.message || 'Failed to load stats' });
  }
});

/** GET /api/v1/admin/users - list users with profile type (admin only) */
router.get('/api/v1/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;
    const r = await query(
      `SELECT u.id, u.email, u.name, u.role, u.created_at, u.last_login,
              p.user_type, p.full_name AS profile_full_name, p.whatsapp
       FROM users u
       LEFT JOIN LATERAL (
         SELECT user_type, full_name, whatsapp FROM user_profiles
         WHERE user_id = u.id ORDER BY updated_at DESC LIMIT 1
       ) p ON true
       ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countRes = await query('SELECT COUNT(*)::int AS total FROM users');
    res.json({
      users: r.rows,
      total: countRes.rows[0]?.total ?? 0,
      limit,
      offset,
    });
  } catch (e) {
    console.error('admin/users', e);
    res.status(500).json({ detail: e.message || 'Failed to list users' });
  }
});

/** PATCH /api/v1/admin/users/:id/role - set user role (admin only) */
router.patch('/api/v1/admin/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const role = (req.body?.role || '').trim();
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ detail: 'Invalid role. Use "user" or "admin".' });
  }
  if (req.user?.id === id && role !== 'admin') {
    return res.status(400).json({ detail: 'You cannot demote yourself from admin.' });
  }
  try {
    const r = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
      [role, id]
    );
    if (r.rows.length === 0) {
      return res.status(404).json({ detail: 'User not found' });
    }
    res.json(r.rows[0]);
  } catch (e) {
    console.error('admin/users/:id/role', e);
    res.status(500).json({ detail: e.message || 'Failed to update role' });
  }
});

/** GET /api/v1/admin/metrics/page-views - visit counts by path (admin only) */
router.get('/api/v1/admin/metrics/page-views', requireAuth, requireAdmin, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
    const r = await query(
      `SELECT path, COUNT(*)::int AS count
       FROM page_visits
       WHERE created_at >= NOW() - $1 * INTERVAL '1 day'
       GROUP BY path
       ORDER BY count DESC`,
      [days]
    );
    const totalRes = await query(
      `SELECT COUNT(*)::int AS total FROM page_visits WHERE created_at >= NOW() - $1 * INTERVAL '1 day'`,
      [days]
    );
    res.json({
      by_path: r.rows,
      total: totalRes.rows[0]?.total ?? 0,
      days,
    });
  } catch (e) {
    console.error('admin/metrics/page-views', e);
    res.status(500).json({ detail: e.message || 'Failed to load page view metrics' });
  }
});

export const adminRouter = router;
