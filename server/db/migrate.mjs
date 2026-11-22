import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is not configured.'); process.exit(1); }
try {
  const sql = neon(process.env.DATABASE_URL);
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await sql.transaction(schema.split(';').map(s=>s.trim()).filter(Boolean).map(s=>sql.query(s)));
  console.log('PV database tables are ready. No existing rows were modified.');
} catch { console.error('Database initialization failed. Check connection, TLS, permissions and database schema.'); process.exit(1); }
