import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** Stub aihub routes - same API surface as FastAPI backend */
router.post('/api/v1/aihub/gentxt', requireAuth, async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.write('data: {"text": "Stub response"}\n\n');
  res.end();
});
router.post('/api/v1/aihub/genimg', requireAuth, (req, res) => {
  res.json({ image: null, revised_prompt: req.body?.prompt || '' });
});

export const aihubRouter = router;
