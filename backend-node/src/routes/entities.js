import { Router } from 'express';
import { query, getClient } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * Generic entity CRUD. Tables must exist (created by Python backend or migrations).
 * Prefix example: /api/v1/entities/quotes -> table "quotes"
 */
const entityConfigs = [
  { prefix: '/api/v1/entities/quotes', table: 'quotes', idCol: 'id', userCol: 'user_id', columns: ['user_id', 'project_id', 'amount', 'description', 'estimated_days', 'status'] },
  { prefix: '/api/v1/entities/reviews', table: 'reviews', idCol: 'id', userCol: 'user_id', columns: ['user_id', 'reviewer_id', 'reviewed_id', 'project_id', 'rating', 'comment', 'reviewer_type'] },
  { prefix: '/api/v1/entities/project_requests', table: 'project_requests', idCol: 'id', userCol: 'user_id', columns: ['user_id', 'title', 'description', 'is_all_inclusive', 'client_provides_materials', 'estimated_budget', 'location', 'status', 'selected_quote_id', 'payment_status', 'total_client_paid', 'paid_at'] },
  { prefix: '/api/v1/entities/project_files', table: 'project_files', idCol: 'id', userCol: 'user_id', columns: ['user_id', 'project_id', 'file_name', 'file_url', 'file_type', 'file_size'] },
  { prefix: '/api/v1/entities/user_profiles', table: 'user_profiles', idCol: 'id', userCol: 'user_id', columns: ['user_id', 'user_type', 'full_name', 'email', 'whatsapp', 'id_number', 'bio', 'services', 'profile_image', 'is_verified', 'average_rating', 'total_reviews'] },
  { prefix: '/api/v1/entities/platform_ratings', table: 'platform_ratings', idCol: 'id', userCol: 'user_id', columns: ['user_id', 'rating', 'feedback'] },
];

function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Recompute and set user_profiles.average_rating and total_reviews for the given user (reviewed_id). */
async function updateUserProfileRating(reviewedId) {
  if (!reviewedId) return;
  try {
    const agg = await query(
      'SELECT COALESCE(AVG(rating), 0)::double precision AS avg_rating, COUNT(*)::int AS total FROM reviews WHERE reviewed_id = $1',
      [reviewedId]
    );
    const avg = parseFloat(agg.rows[0]?.avg_rating ?? 0);
    const total = parseInt(agg.rows[0]?.total ?? 0, 10);
    await query(
      'UPDATE user_profiles SET average_rating = $1, total_reviews = $2, updated_at = NOW() WHERE user_id = $3',
      [avg, total, reviewedId]
    );
  } catch (e) {
    console.error('updateUserProfileRating:', e);
  }
}
function toSnake(str) {
  return str.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
}
/** Return row as JSON with snake_case keys to match frontend types (UserProfile.user_type, full_name, etc.) and FastAPI response shape. */
function rowToJson(row, cols) {
  const out = {};
  for (const c of cols) {
    let v = row[c];
    if (v instanceof Date) v = v.toISOString();
    out[c] = v;
  }
  return out;
}

function buildEntityRouter(config) {
  const r = Router();
  const { table, idCol, userCol, columns } = config;
  const selectCols = '*';

  r.get(config.prefix, requireAuth, async (req, res) => {
    try {
      const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
      const limit = Math.min(2000, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const sort = req.query.sort || `-${idCol}`;
      const orderCol = sort.startsWith('-') ? toSnake(sort.slice(1)) : toSnake(sort);
      const orderDir = sort.startsWith('-') ? 'DESC' : 'ASC';
      const userId = req.user.id;

      const countResult = await query(`SELECT COUNT(*)::int AS total FROM ${table} WHERE ${userCol} = $1`, [userId]);
      const total = countResult.rows[0].total;
      const safeOrder = ['id', 'created_at', 'updated_at', ...columns].includes(orderCol) ? orderCol : idCol;
      const q = `SELECT ${selectCols} FROM ${table} WHERE ${userCol} = $1 ORDER BY ${safeOrder} ${orderDir} LIMIT $2 OFFSET $3`;
      const result = await query(q, [userId, limit, skip]);
      const items = result.rows.map((row) => {
        const keys = Object.keys(row);
        return rowToJson(row, keys.length ? keys : [idCol, userCol, ...columns]);
      });
      res.json({ items, total, skip, limit });
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: err.message });
    }
  });

  r.get(`${config.prefix}/all`, async (req, res) => {
    try {
      const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
      const limit = Math.min(2000, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const sort = req.query.sort || `-${idCol}`;
      const orderCol = sort.startsWith('-') ? toSnake(sort.slice(1)) : toSnake(sort);
      const orderDir = sort.startsWith('-') ? 'DESC' : 'ASC';
      const safeOrder = ['id', 'created_at', 'updated_at', ...columns].includes(orderCol) ? orderCol : idCol;

      let queryDict = null;
      if (req.query.query) {
        try {
          const parsed = typeof req.query.query === 'string' ? JSON.parse(req.query.query) : req.query.query;
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) queryDict = parsed;
        } catch (e) {
          return res.status(400).json({ detail: 'Invalid query JSON format' });
        }
      }
      const allowedCols = ['id', 'created_at', 'updated_at', ...columns];
      const whereParts = [];
      const countParams = [];
      const selectParams = [];
      let paramIndex = 1;
      if (queryDict && Object.keys(queryDict).length > 0) {
        for (const [k, v] of Object.entries(queryDict)) {
          const col = toSnake(k);
          if (!allowedCols.includes(col)) continue;
          whereParts.push(`${col} = $${paramIndex}`);
          countParams.push(v);
          selectParams.push(v);
          paramIndex += 1;
        }
      }
      const whereClause = whereParts.length ? ` WHERE ${whereParts.join(' AND ')}` : '';
      const countResult = await query(
        `SELECT COUNT(*)::int AS total FROM ${table}${whereClause}`,
        countParams
      );
      const total = countResult.rows[0].total;
      const result = await query(
        `SELECT ${selectCols} FROM ${table}${whereClause} ORDER BY ${safeOrder} ${orderDir} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...selectParams, limit, skip]
      );
      const items = result.rows.map((row) => {
        const keys = Object.keys(row);
        return rowToJson(row, keys.length ? keys : [idCol, userCol, ...columns]);
      });
      res.json({ items, total, skip, limit });
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: err.message });
    }
  });

  if (table === 'reviews') {
    r.get(`${config.prefix}/by-reviewed`, requireAuth, async (req, res) => {
      try {
        const result = await query(
          `SELECT r.id, r.user_id, r.reviewer_id, r.reviewed_id, r.project_id, r.rating, r.comment, r.reviewer_type, r.created_at,
             up.full_name AS reviewer_name
           FROM reviews r
           LEFT JOIN user_profiles up ON up.user_id = r.reviewer_id
           WHERE r.reviewed_id = $1
           ORDER BY r.created_at DESC`,
          [req.user.id]
        );
        const items = result.rows.map((row) => rowToJson(row, Object.keys(row)));
        res.json({ items, total: items.length, skip: 0, limit: items.length });
      } catch (err) {
        console.error(err);
        res.status(500).json({ detail: err.message });
      }
    });
  }

  if (table === 'quotes') {
    r.get(`${config.prefix}/by-project/:projectId`, requireAuth, async (req, res) => {
      const projectId = parseInt(req.params.projectId, 10);
      if (Number.isNaN(projectId)) return res.status(400).json({ detail: 'Invalid project id' });
      try {
        const projectCheck = await query('SELECT id FROM project_requests WHERE id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (projectCheck.rows.length === 0) return res.status(404).json({ detail: 'Project not found or access denied' });
        const result = await query(
          `SELECT q.id, q.user_id, q.project_id, q.amount, q.description, q.estimated_days, q.status, q.created_at, q.updated_at,
            up.full_name AS professional_name
           FROM quotes q
           LEFT JOIN user_profiles up ON up.user_id = q.user_id
           WHERE q.project_id = $1
           ORDER BY q.created_at DESC`,
          [projectId]
        );
        const items = result.rows.map((row) => rowToJson(row, Object.keys(row)));
        res.json({ items, total: items.length, skip: 0, limit: items.length });
      } catch (err) {
        console.error(err);
        res.status(500).json({ detail: err.message });
      }
    });

    r.patch(`${config.prefix}/:id/status`, requireAuth, async (req, res) => {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) return res.status(400).json({ detail: 'Invalid id' });
      const status = req.body?.status || req.body?.data?.status;
      if (status !== 'accepted' && status !== 'rejected') return res.status(400).json({ detail: 'status must be accepted or rejected' });
      try {
        const quoteRow = await query('SELECT id, project_id FROM quotes WHERE id = $1', [id]);
        if (quoteRow.rows.length === 0) return res.status(404).json({ detail: 'Quote not found' });
        const projectId = quoteRow.rows[0].project_id;
        const projectCheck = await query('SELECT id FROM project_requests WHERE id = $1 AND user_id = $2', [projectId, req.user.id]);
        if (projectCheck.rows.length === 0) return res.status(403).json({ detail: 'Only the project owner can accept or reject quotes' });
        await query('UPDATE quotes SET status = $1 WHERE id = $2', [status, id]);
        const result = await query(`SELECT ${selectCols} FROM quotes WHERE id = $1`, [id]);
        const row = result.rows[0];
        if (status === 'accepted' && row && row.amount != null) {
          await query(
            'INSERT INTO project_transactions (project_id, transaction_type, amount) VALUES ($1, $2, $3)',
            [projectId, 'quote_accepted', row.amount]
          );
        }
        res.json(rowToJson(row, Object.keys(row)));
      } catch (err) {
        console.error(err);
        res.status(500).json({ detail: err.message });
      }
    });
  }

  r.get(`${config.prefix}/:id`, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ detail: 'Invalid id' });
    try {
      const result = await query(`SELECT ${selectCols} FROM ${table} WHERE ${idCol} = $1 AND ${userCol} = $2`, [id, req.user.id]);
      const row = result.rows[0];
      if (!row) return res.status(404).json({ detail: 'Not found' });
      res.json(rowToJson(row, Object.keys(row)));
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: err.message });
    }
  });

  r.post(config.prefix, requireAuth, async (req, res) => {
    const body = req.body || {};
    let payload = body.data !== undefined ? body.data : body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        return res.status(400).json({ detail: 'Invalid JSON in body.data' });
      }
    }
    const data = { ...payload, [userCol]: req.user.id };
    if (table === 'user_profiles' && (data.user_type !== undefined || data.userType !== undefined)) {
      data.user_type = data.user_type ?? data.userType;
    }
    if (table === 'reviews') {
      const r = parseInt(data.rating, 10);
      if (Number.isNaN(r) || r < 1 || r > 5) {
        return res.status(400).json({ detail: 'rating must be an integer between 1 and 5' });
      }
      data.rating = r;
      if (!data.reviewer_id) data.reviewer_id = req.user.id;
    }
    if (table === 'platform_ratings') {
      const r = parseInt(data.rating, 10);
      if (Number.isNaN(r) || r < 1 || r > 5) {
        return res.status(400).json({ detail: 'rating must be an integer between 1 and 5' });
      }
      data.rating = r;
    }
    const cols = columns.filter((c) => data[toCamel(c)] !== undefined || data[c] !== undefined);
    const values = cols.map((c) => data[toCamel(c)] ?? data[c]);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const colList = cols.join(', ');
    try {
      const result = await query(`INSERT INTO ${table} (${colList}) VALUES (${placeholders}) RETURNING ${selectCols}`, values);
      const row = result.rows[0];
      if (table === 'reviews' && row && row.reviewed_id) {
        await updateUserProfileRating(row.reviewed_id);
      }
      res.status(201).json(rowToJson(row, Object.keys(row)));
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: err.message });
    }
  });

  r.post(`${config.prefix}/batch`, requireAuth, async (req, res) => {
    const items = req.body?.items || [];
    const out = [];
    const client = await getClient();
    try {
      for (const item of items) {
        const payload = item?.data !== undefined ? item.data : item;
        const data = { ...payload, [userCol]: req.user.id };
        const cols = columns.filter((c) => data[toCamel(c)] !== undefined || data[c] !== undefined);
        const values = cols.map((c) => data[toCamel(c)] ?? data[c]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const colList = cols.join(', ');
        const result = await client.query(`INSERT INTO ${table} (${colList}) VALUES (${placeholders}) RETURNING ${selectCols}`, values);
        out.push(rowToJson(result.rows[0], Object.keys(result.rows[0])));
      }
      res.status(201).json(out);
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: err.message });
    } finally {
      client.release();
    }
  });

  r.put(`${config.prefix}/:id`, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ detail: 'Invalid id' });
    const body = req.body || {};
    const payload = body.data !== undefined ? body.data : body;
    const updates = columns.filter((c) => payload[toCamel(c)] !== undefined || payload[c] !== undefined);
    if (updates.length === 0) {
      const result = await query(`SELECT ${selectCols} FROM ${table} WHERE ${idCol} = $1 AND ${userCol} = $2`, [id, req.user.id]);
      const row = result.rows[0];
      if (!row) return res.status(404).json({ detail: 'Not found' });
      return res.json(rowToJson(row, Object.keys(row)));
    }
    if ((table === 'reviews' || table === 'platform_ratings') && updates.includes('rating')) {
      const r = parseInt(payload.rating, 10);
      if (Number.isNaN(r) || r < 1 || r > 5) {
        return res.status(400).json({ detail: 'rating must be an integer between 1 and 5' });
      }
    }
    let beforeRow = null;
    if (table === 'project_requests') {
      const beforeResult = await query(`SELECT payment_status, status, total_client_paid FROM ${table} WHERE ${idCol} = $1 AND ${userCol} = $2`, [id, req.user.id]);
      beforeRow = beforeResult.rows[0] || null;
    }
    const setClause = updates.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const values = updates.map((c) => payload[toCamel(c)] ?? payload[c]);
    values.push(id, req.user.id);
    try {
      const result = await query(
        `UPDATE ${table} SET ${setClause} WHERE ${idCol} = $${updates.length + 1} AND ${userCol} = $${updates.length + 2} RETURNING ${selectCols}`,
        values
      );
      const row = result.rows[0];
      if (!row) return res.status(404).json({ detail: 'Not found' });
      if (table === 'reviews' && row.reviewed_id) {
        await updateUserProfileRating(row.reviewed_id);
      }
      if (table === 'project_requests' && beforeRow) {
        const newPaymentStatus = row.payment_status ?? beforeRow.payment_status;
        const newStatus = row.status ?? beforeRow.status;
        const oldPaymentStatus = beforeRow.payment_status;
        const projectId = row.id;
        if (newPaymentStatus === 'paid' && oldPaymentStatus !== 'paid') {
          const amount = row.total_client_paid != null ? row.total_client_paid : null;
          await query('INSERT INTO project_transactions (project_id, transaction_type, amount) VALUES ($1, $2, $3)', [projectId, 'payment_deposited', amount]);
        }
        if (newPaymentStatus === 'released' && newStatus === 'completed') {
          const amount = row.total_client_paid != null ? row.total_client_paid : null;
          await query('INSERT INTO project_transactions (project_id, transaction_type, amount) VALUES ($1, $2, $3)', [projectId, 'payment_released', amount]);
          await query('INSERT INTO project_transactions (project_id, transaction_type, amount) VALUES ($1, $2, NULL)', [projectId, 'project_completed']);
          const quoteRow = await query('SELECT user_id, amount FROM quotes WHERE id = $1', [row.selected_quote_id]);
          if (quoteRow.rows.length > 0) {
            const professionalUserId = quoteRow.rows[0].user_id;
            const quoteAmount = parseFloat(quoteRow.rows[0].amount);
            const professionalAmount = quoteAmount * 0.9;
            await query(
              'INSERT INTO balance_transactions (user_id, amount, type, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5)',
              [professionalUserId, professionalAmount, 'released_payment', 'project', projectId]
            );
            await query(
              `INSERT INTO user_balances (user_id, balance, updated_at) VALUES ($1, $2, NOW())
               ON CONFLICT (user_id) DO UPDATE SET balance = user_balances.balance + EXCLUDED.balance, updated_at = NOW()`,
              [professionalUserId, professionalAmount]
            );
          }
        }
        if (newStatus === 'completed' && (beforeRow.status !== 'completed') && newPaymentStatus !== 'released') {
          await query('INSERT INTO project_transactions (project_id, transaction_type, amount) VALUES ($1, $2, NULL)', [projectId, 'project_completed']);
        }
      }
      res.json(rowToJson(row, Object.keys(row)));
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: err.message });
    }
  });

  r.put(`${config.prefix}/batch`, requireAuth, async (req, res) => {
    const items = req.body?.items || [];
    const out = [];
    const client = await getClient();
    try {
      for (const it of items) {
        const id = it.id;
        const updates = columns.filter((c) => (it.updates || it)[toCamel(c)] !== undefined || (it.updates || it)[c] !== undefined);
        const upd = it.updates || it;
        if (updates.length === 0) {
          const result = await client.query(`SELECT ${selectCols} FROM ${table} WHERE ${idCol} = $1 AND ${userCol} = $2`, [id, req.user.id]);
          if (result.rows[0]) out.push(rowToJson(result.rows[0], Object.keys(result.rows[0])));
          continue;
        }
        const setClause = updates.map((c, i) => `${c} = $${i + 1}`).join(', ');
        const values = updates.map((c) => upd[toCamel(c)] ?? upd[c]);
        values.push(id, req.user.id);
        const result = await client.query(
          `UPDATE ${table} SET ${setClause} WHERE ${idCol} = $${updates.length + 1} AND ${userCol} = $${updates.length + 2} RETURNING ${selectCols}`,
          values
        );
        if (result.rows[0]) out.push(rowToJson(result.rows[0], Object.keys(result.rows[0])));
      }
      res.json(out);
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: err.message });
    } finally {
      client.release();
    }
  });

  r.delete(`${config.prefix}/batch`, requireAuth, async (req, res) => {
    const ids = req.body?.ids || [];
    if (ids.length === 0) return res.status(200).send();
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    try {
      await query(`DELETE FROM ${table} WHERE ${idCol} = ANY($1::int[]) AND ${userCol} = $2`, [ids, req.user.id]);
      res.status(200).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: err.message });
    }
  });

  r.delete(`${config.prefix}/:id`, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ detail: 'Invalid id' });
    try {
      if (table === 'reviews') {
        const before = await query('SELECT reviewed_id FROM reviews WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        const reviewedId = before.rows[0]?.reviewed_id;
        const result = await query(`DELETE FROM ${table} WHERE ${idCol} = $1 AND ${userCol} = $2 RETURNING 1`, [id, req.user.id]);
        if (result.rowCount === 0) return res.status(404).json({ detail: 'Not found' });
        if (reviewedId) await updateUserProfileRating(reviewedId);
        return res.status(200).send();
      }
      const result = await query(`DELETE FROM ${table} WHERE ${idCol} = $1 AND ${userCol} = $2 RETURNING 1`, [id, req.user.id]);
      if (result.rowCount === 0) return res.status(404).json({ detail: 'Not found' });
      res.status(200).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ detail: err.message });
    }
  });

  return r;
}

const router = Router();
for (const config of entityConfigs) {
  router.use(buildEntityRouter(config));
}

/** Transaction history: list by project (user must be project owner or accepted professional) */
router.get('/api/v1/entities/project_transactions/by-project/:projectId', requireAuth, async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (Number.isNaN(projectId)) return res.status(400).json({ detail: 'Invalid project id' });
  try {
    const proj = await query(
      'SELECT pr.user_id AS owner_id, pr.selected_quote_id, q.user_id AS professional_id FROM project_requests pr LEFT JOIN quotes q ON q.id = pr.selected_quote_id AND q.project_id = pr.id WHERE pr.id = $1',
      [projectId]
    );
    const p = proj.rows[0];
    if (!p) return res.status(404).json({ detail: 'Project not found' });
    const userId = req.user.id;
    if (p.owner_id !== userId && p.professional_id !== userId) {
      return res.status(403).json({ detail: 'Not authorized to view this project transactions' });
    }
    const result = await query(
      'SELECT id, project_id, transaction_type, amount, created_at FROM project_transactions WHERE project_id = $1 ORDER BY created_at ASC',
      [projectId]
    );
    const items = result.rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      transaction_type: row.transaction_type,
      amount: row.amount != null ? parseFloat(row.amount) : null,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    }));
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** Transaction history: list all for current user (projects where user is owner or accepted professional) */
router.get('/api/v1/entities/project_transactions', requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(
      `SELECT pt.id, pt.project_id, pt.transaction_type, pt.amount, pt.created_at, pr.title AS project_title
       FROM project_transactions pt
       JOIN project_requests pr ON pr.id = pt.project_id
       LEFT JOIN quotes q ON q.id = pr.selected_quote_id AND q.project_id = pr.id
       WHERE pr.user_id = $1 OR q.user_id = $1
       ORDER BY pt.created_at DESC
       LIMIT 500`,
      [userId]
    );
    const items = result.rows.map((row) => ({
      id: row.id,
      project_id: row.project_id,
      project_title: row.project_title,
      transaction_type: row.transaction_type,
      amount: row.amount != null ? parseFloat(row.amount) : null,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    }));
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

export const entitiesRouter = router;
