import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

/** GET /api/v1/admin/settings - list settings (admin only); returns env-style config like FastAPI */
router.get('/api/v1/admin/settings', requireAuth, requireAdmin, (req, res) => {
  res.json({
    backend_vars: {},
    frontend_vars: {},
  });
});

/** PUT /api/v1/admin/settings/backend/:key */
router.put('/api/v1/admin/settings/backend/:key', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json({ key: req.params.key, value: req.body?.value ?? '' });
});

/** PUT /api/v1/admin/settings/frontend/:key */
router.put('/api/v1/admin/settings/frontend/:key', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json({ key: req.params.key, value: req.body?.value ?? '' });
});

/** POST /api/v1/admin/settings/backend/:key */
router.post('/api/v1/admin/settings/backend/:key', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json({ key: req.params.key });
});

/** POST /api/v1/admin/settings/frontend/:key */
router.post('/api/v1/admin/settings/frontend/:key', requireAuth, requireAdmin, (req, res) => {
  res.status(200).json({ key: req.params.key });
});

/** DELETE /api/v1/admin/settings/backend/:key */
router.delete('/api/v1/admin/settings/backend/:key', requireAuth, requireAdmin, (req, res) => {
  res.status(200).send();
});

/** DELETE /api/v1/admin/settings/frontend/:key */
router.delete('/api/v1/admin/settings/frontend/:key', requireAuth, requireAdmin, (req, res) => {
  res.status(200).send();
});

export const settingsRouter = router;
