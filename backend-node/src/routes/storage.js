import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

/** Stub storage routes - same API surface as FastAPI backend; implement with real OSS/S3 if needed */
router.post('/api/v1/storage/create-bucket', requireAuth, requireAdmin, (req, res) => {
  res.json({ bucket_name: req.body?.bucket_name || 'default', message: 'Bucket created (stub)' });
});
router.get('/api/v1/storage/list-buckets', requireAuth, (req, res) => {
  res.json({ buckets: [] });
});
router.get('/api/v1/storage/list-objects', requireAuth, (req, res) => {
  res.json({ objects: [], prefix: req.query?.prefix || '' });
});
router.get('/api/v1/storage/get-object-info', requireAuth, (req, res) => {
  res.json({ bucket_name: req.query?.bucket_name, object_key: req.query?.object_key });
});
router.post('/api/v1/storage/rename-object', requireAuth, (req, res) => {
  res.json({ success: true });
});
router.delete('/api/v1/storage/delete-object', requireAuth, (req, res) => {
  res.json({ success: true });
});
router.post('/api/v1/storage/upload-url', requireAuth, (req, res) => {
  res.json({ url: '', method: 'PUT', expires_in: 3600 });
});
router.post('/api/v1/storage/download-url', requireAuth, (req, res) => {
  res.json({ url: '', expires_in: 3600 });
});

export const storageRouter = router;
