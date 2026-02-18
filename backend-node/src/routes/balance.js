import { Router } from 'express';
import { query } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/** GET /api/v1/balance - current user's balance */
router.get('/api/v1/balance', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT balance, updated_at FROM user_balances WHERE user_id = $1',
      [req.user.id]
    );
    const row = result.rows[0];
    const balance = row ? parseFloat(row.balance) : 0;
    const updatedAt = row?.updated_at instanceof Date ? row.updated_at.toISOString() : null;
    res.json({ balance, updated_at: updatedAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** GET /api/v1/balance/transactions - balance transaction history */
router.get('/api/v1/balance/transactions', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, amount, type, reference_type, reference_id, created_at FROM balance_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200',
      [req.user.id]
    );
    const items = result.rows.map((r) => ({
      id: r.id,
      amount: parseFloat(r.amount),
      type: r.type,
      reference_type: r.reference_type,
      reference_id: r.reference_id,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    }));
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

const WITHDRAWAL_TYPES = ['bank_account', 'paypal', 'payoneer'];
const BILLING_TYPES = ['card', 'paypal', 'payoneer'];

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  const show = local.length <= 2 ? local[0] + '***' : local.slice(0, 2) + '***';
  return `${show}@${domain}`;
}

/** GET /api/v1/withdrawal-methods - list current user's methods */
router.get('/api/v1/withdrawal-methods', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, type, label, bank_name, account_last4, routing_or_swift, identifier, is_default, created_at FROM withdrawal_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC',
      [req.user.id]
    );
    const items = result.rows.map((r) => ({
      id: r.id,
      type: r.type,
      label: r.label,
      bank_name: r.bank_name,
      account_last4: r.account_last4,
      routing_or_swift: r.routing_or_swift,
      identifier: r.identifier,
      is_default: r.is_default,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    }));
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** POST /api/v1/withdrawal-methods - add withdrawal method (paypal, payoneer, bank_account) */
router.post('/api/v1/withdrawal-methods', requireAuth, async (req, res) => {
  const body = req.body?.data ?? req.body ?? {};
  const type = (body.type || 'bank_account').toLowerCase();
  if (!WITHDRAWAL_TYPES.includes(type)) {
    return res.status(400).json({ detail: 'type must be paypal, payoneer, or bank_account' });
  }
  const isDefault = Boolean(body.is_default ?? body.isDefault);

  try {
    if (isDefault) {
      await query('UPDATE withdrawal_methods SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    let label, bankName, accountLast4, routingOrSwift, identifier;
    if (type === 'paypal' || type === 'payoneer') {
      const email = (body.email || body.identifier || '').trim();
      if (!email || !email.includes('@')) {
        return res.status(400).json({ detail: 'email is required for PayPal and Payoneer' });
      }
      identifier = email;
      label = body.label || `${type === 'paypal' ? 'PayPal' : 'Payoneer'} ${maskEmail(email)}`;
      bankName = null;
      accountLast4 = null;
      routingOrSwift = null;
    } else {
      bankName = body.bank_name ?? body.bankName ?? '';
      const accountNumber = body.account_number ?? body.accountNumber ?? '';
      routingOrSwift = body.routing_or_swift ?? body.routingOrSwift ?? '';
      accountLast4 = accountNumber.length >= 4 ? accountNumber.slice(-4) : accountNumber;
      label = body.label || (bankName && accountLast4 ? `${bankName} ****${accountLast4}` : 'Cuenta bancaria');
      identifier = null;
    }

    const result = await query(
      `INSERT INTO withdrawal_methods (user_id, type, label, bank_name, account_last4, routing_or_swift, identifier, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, type, label, bank_name, account_last4, routing_or_swift, identifier, is_default, created_at`,
      [req.user.id, type, label, bankName, accountLast4, routingOrSwift, identifier, isDefault]
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      type: row.type,
      label: row.label,
      bank_name: row.bank_name,
      account_last4: row.account_last4,
      routing_or_swift: row.routing_or_swift,
      identifier: row.identifier,
      is_default: row.is_default,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** PATCH /api/v1/withdrawal-methods/:id - update (e.g. set default) */
router.patch('/api/v1/withdrawal-methods/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ detail: 'Invalid id' });
  const body = req.body?.data ?? req.body ?? {};
  try {
    const check = await query('SELECT id FROM withdrawal_methods WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (check.rows.length === 0) return res.status(404).json({ detail: 'Not found' });
    if (body.is_default === true || body.isDefault === true) {
      await query('UPDATE withdrawal_methods SET is_default = false WHERE user_id = $1', [req.user.id]);
      await query('UPDATE withdrawal_methods SET is_default = true WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    }
    const result = await query(
      'SELECT id, type, label, bank_name, account_last4, routing_or_swift, identifier, is_default, created_at FROM withdrawal_methods WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    const row = result.rows[0];
    res.json({
      id: row.id,
      type: row.type,
      label: row.label,
      bank_name: row.bank_name,
      account_last4: row.account_last4,
      routing_or_swift: row.routing_or_swift,
      identifier: row.identifier,
      is_default: row.is_default,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** DELETE /api/v1/withdrawal-methods/:id */
router.delete('/api/v1/withdrawal-methods/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ detail: 'Invalid id' });
  try {
    const result = await query('DELETE FROM withdrawal_methods WHERE id = $1 AND user_id = $2 RETURNING 1', [id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ detail: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** POST /api/v1/withdrawals - create withdrawal request */
router.post('/api/v1/withdrawals', requireAuth, async (req, res) => {
  const body = req.body?.data ?? req.body ?? {};
  const amount = parseFloat(body.amount);
  const withdrawalMethodId = parseInt(body.withdrawal_method_id ?? body.withdrawalMethodId, 10);
  if (Number.isNaN(amount) || amount <= 0) return res.status(400).json({ detail: 'amount must be a positive number' });
  if (Number.isNaN(withdrawalMethodId)) return res.status(400).json({ detail: 'withdrawal_method_id required' });

  try {
    const balanceRow = await query('SELECT balance FROM user_balances WHERE user_id = $1', [req.user.id]);
    const currentBalance = balanceRow.rows[0] ? parseFloat(balanceRow.rows[0].balance) : 0;
    if (currentBalance < amount) return res.status(400).json({ detail: 'Saldo insuficiente' });

    const methodCheck = await query('SELECT id FROM withdrawal_methods WHERE id = $1 AND user_id = $2', [withdrawalMethodId, req.user.id]);
    if (methodCheck.rows.length === 0) return res.status(404).json({ detail: 'Método de retiro no encontrado' });

    const withdrawalResult = await query(
      'INSERT INTO withdrawals (user_id, amount, withdrawal_method_id, status) VALUES ($1, $2, $3, $4) RETURNING id, amount, withdrawal_method_id, status, created_at',
      [req.user.id, amount, withdrawalMethodId, 'pending']
    );
    const w = withdrawalResult.rows[0];
    const withdrawalId = w.id;

    await query('UPDATE user_balances SET balance = balance - $1, updated_at = NOW() WHERE user_id = $2', [amount, req.user.id]);
    await query(
      'INSERT INTO balance_transactions (user_id, amount, type, reference_type, reference_id) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, -amount, 'withdrawal', 'withdrawal', withdrawalId]
    );
    const newBalanceRow = await query('SELECT balance FROM user_balances WHERE user_id = $1', [req.user.id]);
    const newBalance = newBalanceRow.rows[0] ? parseFloat(newBalanceRow.rows[0].balance) : 0;

    res.status(201).json({
      id: w.id,
      amount: parseFloat(w.amount),
      withdrawal_method_id: w.withdrawal_method_id,
      status: w.status,
      created_at: w.created_at instanceof Date ? w.created_at.toISOString() : w.created_at,
      balance_after: newBalance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** GET /api/v1/withdrawals - list user's withdrawals */
router.get('/api/v1/withdrawals', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT w.id, w.amount, w.withdrawal_method_id, w.status, w.created_at, w.processed_at, m.label AS method_label, m.type AS method_type, m.bank_name, m.account_last4, m.identifier
       FROM withdrawals w
       LEFT JOIN withdrawal_methods m ON m.id = w.withdrawal_method_id AND m.user_id = w.user_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC
       LIMIT 100`,
      [req.user.id]
    );
    const items = result.rows.map((r) => ({
      id: r.id,
      amount: parseFloat(r.amount),
      withdrawal_method_id: r.withdrawal_method_id,
      method_label: r.method_label,
      method_type: r.method_type,
      bank_name: r.bank_name,
      account_last4: r.account_last4,
      identifier: r.identifier,
      status: r.status,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
      processed_at: r.processed_at ? (r.processed_at instanceof Date ? r.processed_at.toISOString() : r.processed_at) : null,
    }));
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** GET /api/v1/billing-methods - list client billing methods (card, paypal, payoneer) */
router.get('/api/v1/billing-methods', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, type, label, last4, card_brand, email, is_default, created_at FROM billing_methods WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC',
      [req.user.id]
    );
    const items = result.rows.map((r) => ({
      id: r.id,
      type: r.type,
      label: r.label,
      last4: r.last4,
      card_brand: r.card_brand,
      email: r.email,
      is_default: r.is_default,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    }));
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** POST /api/v1/billing-methods - add billing method (card, paypal, payoneer) */
router.post('/api/v1/billing-methods', requireAuth, async (req, res) => {
  const body = req.body?.data ?? req.body ?? {};
  const type = (body.type || 'card').toLowerCase();
  if (!BILLING_TYPES.includes(type)) {
    return res.status(400).json({ detail: 'type must be card, paypal, or payoneer' });
  }
  const isDefault = Boolean(body.is_default ?? body.isDefault);

  try {
    if (isDefault) {
      await query('UPDATE billing_methods SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    let label, last4, cardBrand, email;
    if (type === 'card') {
      const number = (body.card_number ?? body.number ?? '').replace(/\s/g, '');
      last4 = number.length >= 4 ? number.slice(-4) : number || null;
      cardBrand = (body.card_brand ?? body.brand ?? 'card').toLowerCase();
      label = body.label || (cardBrand && last4 ? `${cardBrand} ****${last4}` : 'Tarjeta');
      email = null;
    } else {
      email = (body.email || '').trim();
      if (!email || !email.includes('@')) {
        return res.status(400).json({ detail: 'email is required for PayPal and Payoneer' });
      }
      label = body.label || `${type === 'paypal' ? 'PayPal' : 'Payoneer'} ${maskEmail(email)}`;
      last4 = null;
      cardBrand = null;
    }

    const result = await query(
      `INSERT INTO billing_methods (user_id, type, label, last4, card_brand, email, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, type, label, last4, card_brand, email, is_default, created_at`,
      [req.user.id, type, label, last4, cardBrand, email, isDefault]
    );
    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      type: row.type,
      label: row.label,
      last4: row.last4,
      card_brand: row.card_brand,
      email: row.email,
      is_default: row.is_default,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** PATCH /api/v1/billing-methods/:id */
router.patch('/api/v1/billing-methods/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ detail: 'Invalid id' });
  const body = req.body?.data ?? req.body ?? {};
  try {
    const check = await query('SELECT id FROM billing_methods WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (check.rows.length === 0) return res.status(404).json({ detail: 'Not found' });
    if (body.is_default === true || body.isDefault === true) {
      await query('UPDATE billing_methods SET is_default = false WHERE user_id = $1', [req.user.id]);
      await query('UPDATE billing_methods SET is_default = true WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    }
    const result = await query(
      'SELECT id, type, label, last4, card_brand, email, is_default, created_at FROM billing_methods WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    const row = result.rows[0];
    res.json({
      id: row.id,
      type: row.type,
      label: row.label,
      last4: row.last4,
      card_brand: row.card_brand,
      email: row.email,
      is_default: row.is_default,
      created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

/** DELETE /api/v1/billing-methods/:id */
router.delete('/api/v1/billing-methods/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ detail: 'Invalid id' });
  try {
    const result = await query('DELETE FROM billing_methods WHERE id = $1 AND user_id = $2 RETURNING 1', [id, req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ detail: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ detail: err.message });
  }
});

export const balanceRouter = router;
