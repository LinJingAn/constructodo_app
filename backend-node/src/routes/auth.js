import { Router } from 'express';
import { randomUUID, randomBytes } from 'crypto';
import { createRequire } from 'module';
import { OAuth2Client } from 'google-auth-library';

import jwt from 'jsonwebtoken';
import { query, getClient } from '../db.js';
const require = createRequire(import.meta.url);
const bcrypt = require('bcryptjs');
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const JWT_SECRET = process.env.JWT_SECRET_KEY || '';
const JWT_EXPIRE_MINUTES = parseInt(process.env.JWT_EXPIRE_MINUTES || '60', 10);
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';

/** Strip trailing slashes so path concatenation doesn't produce //path */
function stripTrailingSlash(url) {
  return typeof url === 'string' ? url.replace(/\/+$/, '') : url;
}
/** Backend public URL (for OAuth redirect_uri etc). Set BACKEND_URL on VPS. */
function getBackendBaseUrl() {
  return stripTrailingSlash(process.env.BACKEND_URL || `http://127.0.0.1:${process.env.PORT || 8000}`);
}
/** Frontend origin (for redirects after login/logout). Set FRONTEND_URL on VPS. */
function getFrontendUrl() {
  return stripTrailingSlash(process.env.FRONTEND_URL || process.env.BACKEND_URL || 'http://localhost:5173');
}

function issueToken(user) {
  const expiresAt = Math.floor(Date.now() / 1000) + JWT_EXPIRE_MINUTES * 60;
  const token = jwt.sign(
    { sub: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE_MINUTES * 60, algorithm: JWT_ALGORITHM }
  );
  return { token, expires_at: expiresAt, token_type: 'Bearer' };
}

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

const RESET_TOKEN_EXPIRE_HOURS = 1;

/** POST /api/v1/auth/forgot-password - request password reset; sends link (or returns it for dev) */
router.post('/api/v1/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ detail: 'Email is required' });
  }
  const emailClean = email.trim().toLowerCase();
  const db = await getClient();
  try {
    const r = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = $1 AND password_hash IS NOT NULL',
      [emailClean]
    );
    const user = r.rows[0];
    if (!user) {
      // Do not reveal whether the email exists
      return res.json({ message: 'Si existe una cuenta con ese correo, recibirás instrucciones para restablecer la contraseña.' });
    }
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRE_HOURS * 60 * 60 * 1000);
    await db.query(
      'INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [token, user.id, expiresAt]
    );
    const frontend = getFrontendUrl();
    const resetLink = `${frontend}/reset-password?token=${encodeURIComponent(token)}`;
    // TODO: send email with resetLink when SMTP is configured (e.g. nodemailer)
    // For now return link in response (useful for dev; omit in production if you send email)
    const devReturnLink = process.env.NODE_ENV !== 'production' || process.env.CONSTRUCTODO_DEV_RESET_LINK === '1';
    return res.json({
      message: 'Si existe una cuenta con ese correo, recibirás instrucciones para restablecer la contraseña.',
      ...(devReturnLink ? { reset_link: resetLink } : {}),
    });
  } catch (err) {
    console.error('forgot-password', err);
    res.status(500).json({ detail: err.message || 'Failed to process request' });
  } finally {
    db.release();
  }
});

/** POST /api/v1/auth/reset-password - set new password using token */
router.post('/api/v1/auth/reset-password', async (req, res) => {
  const { token, new_password } = req.body || {};
  if (!token || typeof token !== 'string' || !token.trim()) {
    return res.status(400).json({ detail: 'Token is required' });
  }
  if (!new_password || typeof new_password !== 'string' || new_password.length < 6) {
    return res.status(400).json({ detail: 'Password must be at least 6 characters' });
  }
  const tokenClean = token.trim();
  const db = await getClient();
  try {
    const r = await db.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()',
      [tokenClean]
    );
    const row = r.rows[0];
    if (!row) {
      return res.status(400).json({ detail: 'Enlace inválido o expirado. Solicita uno nuevo.' });
    }
    const passwordHash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, row.user_id]);
    await db.query('DELETE FROM password_reset_tokens WHERE token = $1', [tokenClean]);
    return res.json({ message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (err) {
    console.error('reset-password', err);
    res.status(500).json({ detail: err.message || 'Failed to reset password' });
  } finally {
    db.release();
  }
});

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

router.post('/api/v1/auth/token/exchange', async (req, res) => {
  const { platform_token } = req.body || {};
  if (platform_token) {
    return router.handle({ ...req, body: { id_token: platform_token } }, res, () => {});
  }
  return res.status(400).json({ detail: 'platform_token required' });
});

/** POST /api/v1/auth/change-password - change password for logged-in user (email/password accounts only) */
router.post('/api/v1/auth/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!current_password || typeof current_password !== 'string') {
    return res.status(400).json({ detail: 'Contraseña actual es requerida' });
  }
  if (!new_password || typeof new_password !== 'string' || new_password.length < 6) {
    return res.status(400).json({ detail: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }
  const db = await getClient();
  try {
    const r = await db.query('SELECT id, password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = r.rows[0];
    if (!user) {
      return res.status(401).json({ detail: 'Usuario no encontrado' });
    }
    if (!user.password_hash) {
      return res.status(400).json({ detail: 'Esta cuenta no tiene contraseña (inicio de sesión con Google). No puedes cambiarla aquí.' });
    }
    const ok = await bcrypt.compare(current_password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ detail: 'Contraseña actual incorrecta' });
    }
    const passwordHash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.id]);
    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('change-password', err);
    return res.status(500).json({ detail: err.message || 'Error al cambiar contraseña' });
  } finally {
    db.release();
  }
});

/** GET /api/v1/auth/me - return current user; role is read from DB so admin changes apply without re-login */
router.get('/api/v1/auth/me', requireAuth, async (req, res) => {
  try {
    const r = await query('SELECT id, email, name, role, last_login FROM users WHERE id = $1', [req.user.id]);
    const row = r.rows[0];
    if (!row) {
      return res.status(401).json({ detail: 'User not found' });
    }
    res.json({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role || 'user',
      last_login: row.last_login ? new Date(row.last_login).toISOString() : null,
    });
  } catch (err) {
    console.error('auth/me', err);
    res.status(500).json({ detail: err.message || 'Failed to load user' });
  }
});

router.get('/api/v1/auth/login', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.redirect(302, `${getFrontendUrl()}/auth/error?msg=Google+OAuth+not+configured`);
  }
  const redirectUri = getBackendBaseUrl() + '/api/v1/auth/callback';
  const redirect = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile`;
  res.redirect(302, redirect);
});

router.get('/api/v1/auth/callback', async (req, res) => {
  const frontend = getFrontendUrl();
  const { code, error: oauthError } = req.query || {};
  if (oauthError) {
    return res.redirect(302, `${frontend}/auth/error?msg=${encodeURIComponent(oauthError)}`);
  }
  if (!GOOGLE_CLIENT_SECRET) {
    return res.redirect(302, `${frontend}/auth/error?msg=Set+GOOGLE_CLIENT_SECRET+for+redirect+flow+or+use+POST+%2Fapi%2Fv1%2Fauth%2Fgoogle+with+id_token`);
  }
  if (!code || typeof code !== 'string') {
    return res.redirect(302, `${frontend}/auth/error?msg=No+authorization+code`);
  }
  const redirectUri = getBackendBaseUrl() + '/api/v1/auth/callback';
  const oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
  try {
    const { tokens } = await oauth2Client.getToken(code);
    const idToken = tokens.id_token;
    if (!idToken) {
      return res.redirect(302, `${frontend}/auth/error?msg=No+id_token+from+Google`);
    }
    const ticket = await oauth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
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
      res.redirect(302, `${frontend}/auth/callback?token=${encodeURIComponent(token)}`);
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(302, `${frontend}/auth/error?msg=${encodeURIComponent(err.message || 'Callback failed')}`);
  }
});

router.get('/api/v1/auth/logout', (req, res) => {
  res.json({ redirect_url: `${getFrontendUrl()}/` });
});

export const authRouter = router;
