import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

/** POST /api/v1/analytics/page-view - record a page visit (public, for metrics) */
router.post('/api/v1/analytics/page-view', async (req, res) => {
  try {
    const path = (req.body?.path ?? req.query?.path ?? '').toString().slice(0, 500);
    if (!path) {
      return res.status(400).json({ detail: 'path is required' });
    }
    const userId = req.user?.id ?? null;
    await query(
      'INSERT INTO page_visits (path, user_id) VALUES ($1, $2)',
      [path, userId]
    );
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('analytics/page-view', e);
    res.status(500).json({ detail: e.message || 'Failed to record page view' });
  }
});

export const analyticsRouter = router;
