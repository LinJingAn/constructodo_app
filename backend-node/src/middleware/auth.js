import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET_KEY || '';
const JWT_ALGORITHM = process.env.JWT_ALGORITHM || 'HS256';

if (!JWT_SECRET && process.env.NODE_ENV !== 'test') {
  console.warn('JWT_SECRET_KEY is not set; auth-protected routes will return 401.');
}

/**
 * Verify Bearer token and attach user to req.user.
 * Does not require auth (optional auth).
 */
export function optionalAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return next();
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    req.user = {
      id: payload.sub,
      email: payload.email || '',
      name: payload.name || null,
      role: payload.role || 'user',
      last_login: payload.last_login || null,
    };
  } catch {
    // invalid token ignored for optional auth
  }
  next();
}

/**
 * Require valid Bearer token. Respond 401 if missing or invalid.
 */
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Authentication credentials were not provided' });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    req.user = {
      id: payload.sub,
      email: payload.email || '',
      name: payload.name || null,
      role: payload.role || 'user',
      last_login: payload.last_login || null,
    };
    next();
  } catch (err) {
    return res.status(401).json({ detail: err.message || 'Invalid authentication token' });
  }
}

/**
 * Require admin role. Use after requireAuth.
 */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ detail: 'Admin access required' });
  }
  next();
}
