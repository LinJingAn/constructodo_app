import { Router } from 'express';
import { randomUUID } from 'crypto';
import { createRequire } from 'module';
import { OAuth2Client } from 'google-auth-library';

import jwt from 'jsonwebtoken';
import { query, getClient } from '../db.js';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const JWT_SECRET = process.env.JWT_SECRET_KEY || '';
const JWT_EXPIRE_MINUTES = parseInt(process.env.JWT_EXPIRE_MINUTES || '60', 10);
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';

function issueToken(user) {
  const expiresAt = Math.floor(Date.now() / 1000) + JWT_EXPIRE_MINUTES * 60;
  const token = jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE_MINUTES * 60, algorithm: JWT_ALGORITHM }
  );
  return { token, expires_at: expiresAt, token_type: 'Bearer' };
}

/** POST /api/v1/auth/register - email/password registration */
router.post('/api/v1/auth/register', async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ detail: 'Email is required' });
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ detail: 'Password must be at least 6 characters' });
  }
  const emailClean = email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = randomUUID();
  const displayName = (name && typeof name === 'string' ? name.trim() : '') || emailClean.split('@')[0];
  const db = await getClient();
  try {
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = $1', [emailClean]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ detail: 'An account with this email already exists' });
    }
    await db.query(
      'INSERT INTO users (id, email, name, role, password_hash, last_login) VALUES ($1, $2, $3, $4, $5, NOW())',
      [userId, emailClean, displayName || null, 'user', passwordHash]
    );
    const user = { id: userId, email: emailClean, name: displayName || null, role: 'user' };
    res.status(201).json(issueToken(user));
  } catch (err) {
    if (err.code === '42703') {
      return res.status(500).json({ detail: 'Database missing password_hash column. Run: ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);' });
    }
    console.error(err);
    res.status(500).json({ detail: err.message || 'Registration failed' });
  } finally {
    db.release();
  }
});

/** POST /api/v1/auth/email-login - email/password login */
router.post('/api/v1/auth/email-login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ detail: 'Email is required' });
  }
  if (!password) {
    return res.status(400).json({ detail: 'Password is required' });
  }
  const emailClean = email.trim().toLowerCase();
  const db = await getClient();
  try {
    const r = await db.query(
      'SELECT id, email, name, role, password_hash FROM users WHERE LOWER(email) = $1',
      [emailClean]
    );
    const user = r.rows[0];
    if (!user || !user.password_hash) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    res.json(issueToken({ id: user.id, email: user.email, name: user.name, role: user.role }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message || 'Login failed' });
  } finally {
    db.release();
  }
});

/** POST /api/v1/auth/google - Google JWT: verify ID token, issue app JWT */
router.post('/api/v1/auth/google', async (req, res) => {
  const { id_token } = req.body || {};
  if (!id_token) {
    return res.status(400).json({ detail: 'id_token required' });
  }
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ detail: 'Google client ID not configured' });
  }
  try {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: id_token, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const email = payload.email || '';
    const name = payload.name || (email ? email.split('@')[0] : '');
    const sub = payload.sub;

    const db = await getClient();
    try {
      let r = await db.query('SELECT id, email, name, role FROM users WHERE id = $1', [sub]);
      let user = r.rows[0];
      if (!user) {
        await db.query(
          'INSERT INTO users (id, email, name, role, last_login) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (id) DO NOTHING',
          [sub, email, name, 'user']
        );
        r = await db.query('SELECT id, email, name, role FROM users WHERE id = $1', [sub]);
        user = r.rows[0];
      } else {
        await db.query('UPDATE users SET email = $1, name = $2, last_login = NOW() WHERE id = $3', [email, name, sub]);
      }

      const expiresAt = Math.floor(Date.now() / 1000) + JWT_EXPIRE_MINUTES * 60;
      const token = jwt.sign(
        { sub: user.id, email: user.email, name: user.name, role: user.role, last_login: new Date().toISOString() },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE_MINUTES * 60, algorithm: JWT_ALGORITHM }
      );
      res.json({ token, expires_at: expiresAt, token_type: 'Bearer' });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error(err);
    return res.status(401).json({ detail: err.message || 'Invalid ID token' });
  }
});

/** POST /api/v1/auth/token/exchange - exchange platform token for app token (stub: same as google for now) */
router.post('/api/v1/auth/token/exchange', async (req, res) => {
  const { platform_token } = req.body || {};
  if (platform_token) {
    return router.handle({ ...req, body: { id_token: platform_token } }, res, () => {});
  }
  return res.status(400).json({ detail: 'platform_token required' });
});

/** GET /api/v1/auth/me - current user (requires auth) */
router.get('/api/v1/auth/me', requireAuth, (req, res) => {
  res.json(req.user);
});

/** GET /api/v1/auth/login - redirect to Google OAuth (simplified: redirect to frontend or Google) */
router.get('/api/v1/auth/login', (req, res) => {
  const redirect = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 8001}` + '/api/v1/auth/callback')}&response_type=code&scope=openid%20email%20profile`;
  res.redirect(302, redirect);
});

/** GET /api/v1/auth/callback - OIDC callback (simplified: return 501 or redirect to frontend with error) */
router.get('/api/v1/auth/callback', (req, res) => {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(302, `${frontend}/auth/error?msg=Use+POST+%2Fapi%2Fv1%2Fauth%2Fgoogle+with+id_token+instead`);
});

/** GET /api/v1/auth/logout - return redirect_url in JSON (same as FastAPI); frontend clears token then redirects */
router.get('/api/v1/auth/logout', (req, res) => {
  const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.json({ redirect_url: `${frontend}/` });
});

export const authRouter = router;
