import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'constructodo',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function getClient() {
  return pool.connect();
}

/** Check database health */
export async function checkDatabaseHealth() {
  try {
    const r = await query('SELECT 1 AS ok');
    return r.rows[0]?.ok === 1;
  } catch {
    return false;
  }
}

/** Create users and oidc_states tables if they do not exist (matches Python backend schema) */
export async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      password_hash VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_login TIMESTAMP WITH TIME ZONE
    );
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS oidc_states (
      id SERIAL PRIMARY KEY,
      state VARCHAR(255) UNIQUE NOT NULL,
      nonce VARCHAR(255) NOT NULL,
      code_verifier VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      user_type VARCHAR(50) NOT NULL,
      full_name VARCHAR(255),
      email VARCHAR(255),
      whatsapp VARCHAR(255),
      id_number VARCHAR(255),
      bio TEXT,
      services TEXT,
      profile_image VARCHAR(512),
      is_verified BOOLEAN,
      average_rating DOUBLE PRECISION,
      total_reviews INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS ix_user_profiles_user_id ON user_profiles (user_id);`);

  await query(`
    CREATE TABLE IF NOT EXISTS project_requests (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      title VARCHAR(512) NOT NULL,
      description TEXT NOT NULL,
      is_all_inclusive BOOLEAN,
      client_provides_materials BOOLEAN,
      estimated_budget DOUBLE PRECISION,
      location VARCHAR(512),
      status VARCHAR(50),
      selected_quote_id INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS ix_project_requests_user_id ON project_requests (user_id);`);

  // Payment columns (CONSTRUCTODO: client 4.5% on quote, professional 10% on payment received)
  try {
    await query(`ALTER TABLE project_requests ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending_payment'`);
  } catch (e) {
    if (e.code !== '42701') throw e; // duplicate_column = already exists
  }
  try {
    await query(`ALTER TABLE project_requests ADD COLUMN total_client_paid DOUBLE PRECISION`);
  } catch (e) {
    if (e.code !== '42701') throw e;
  }
  try {
    await query(`ALTER TABLE project_requests ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE`);
  } catch (e) {
    if (e.code !== '42701') throw e;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS quotes (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      project_id INTEGER NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      description TEXT,
      estimated_days INTEGER,
      status VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS ix_quotes_user_id ON quotes (user_id);`);

  await query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      reviewer_id VARCHAR(255) NOT NULL,
      reviewed_id VARCHAR(255) NOT NULL,
      project_id INTEGER,
      rating INTEGER NOT NULL,
      comment TEXT,
      reviewer_type VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS ix_reviews_user_id ON reviews (user_id);`);

  await query(`
    CREATE TABLE IF NOT EXISTS project_files (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      project_id INTEGER NOT NULL,
      file_name VARCHAR(512) NOT NULL,
      file_url VARCHAR(1024) NOT NULL,
      file_type VARCHAR(128),
      file_size INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS ix_project_files_user_id ON project_files (user_id);`);

  await query(`
    CREATE TABLE IF NOT EXISTS platform_ratings (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      rating INTEGER NOT NULL,
      feedback TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS ix_platform_ratings_user_id ON platform_ratings (user_id);`);

  await query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      body TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS ix_chat_messages_project_id ON chat_messages (project_id);`);
  await query(`CREATE INDEX IF NOT EXISTS ix_chat_messages_created_at ON chat_messages (created_at);`);

  await query(`
    CREATE TABLE IF NOT EXISTS chat_project_reads (
      project_id INTEGER NOT NULL,
      user_id VARCHAR(255) NOT NULL,
      last_read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      PRIMARY KEY (project_id, user_id)
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS ix_chat_project_reads_user_id ON chat_project_reads (user_id);`);

  await query(`
    CREATE TABLE IF NOT EXISTS project_transactions (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL,
      transaction_type VARCHAR(50) NOT NULL,
      amount DOUBLE PRECISION,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS ix_project_transactions_project_id ON project_transactions (project_id);`);
  await query(`CREATE INDEX IF NOT EXISTS ix_project_transactions_created_at ON project_transactions (created_at);`);

  await query(`
    CREATE TABLE IF NOT EXISTS user_balances (
      user_id VARCHAR(255) PRIMARY KEY,
      balance DOUBLE PRECISION NOT NULL DEFAULT 0,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS balance_transactions (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      type VARCHAR(50) NOT NULL,
      reference_type VARCHAR(50),
      reference_id INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS ix_balance_transactions_user_id ON balance_transactions (user_id);`);

  await query(`
    CREATE TABLE IF NOT EXISTS billing_methods (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      label VARCHAR(256),
      last4 VARCHAR(10),
      card_brand VARCHAR(64),
      email VARCHAR(512),
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS ix_billing_methods_user_id ON billing_methods (user_id);`);

  await query(`
    CREATE TABLE IF NOT EXISTS withdrawal_methods (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'bank_account',
      label VARCHAR(256),
      bank_name VARCHAR(256),
      account_last4 VARCHAR(10),
      routing_or_swift VARCHAR(128),
      identifier VARCHAR(512),
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS ix_withdrawal_methods_user_id ON withdrawal_methods (user_id);`);
  try {
    await query(`ALTER TABLE withdrawal_methods ADD COLUMN identifier VARCHAR(512)`);
  } catch (e) {
    if (e.code !== '42701') throw e;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      withdrawal_method_id INTEGER NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      processed_at TIMESTAMP WITH TIME ZONE
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS ix_withdrawals_user_id ON withdrawals (user_id);`);
}

export default pool;
