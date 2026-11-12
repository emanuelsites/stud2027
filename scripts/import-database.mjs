import {createClient} from '@libsql/client';
import {readFile} from 'node:fs/promises';

const url = process.env.TURSO_DATABASE_URL;
if (!url) throw new Error('Configure TURSO_DATABASE_URL em .env.local.');
const client = createClient({url, authToken: process.env.TURSO_AUTH_TOKEN});
try {
  const existing = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='entries'");
  if (existing.rows.length) {
    const count = await client.execute('SELECT COUNT(*) AS total FROM entries');
    if (Number(count.rows[0].total) > 0) {
      throw new Error('O banco já contém cadastros. Use um banco vazio para importar esta entrega.');
    }
  }
  const schema = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
  const content = JSON.parse(await readFile(new URL('../database/content.json', import.meta.url), 'utf8'));
  const statements = schema.split(';').map(sql => sql.trim()).filter(Boolean).map(sql => ({
    sql: sql.replace(/^CREATE TABLE /, 'CREATE TABLE IF NOT EXISTS ').replace(/^CREATE UNIQUE INDEX /, 'CREATE UNIQUE INDEX IF NOT EXISTS '),
    args: [],
  }));
  for (const [table, rows] of Object.entries(content)) {
    if (!/^[a-z_]+$/.test(table)) throw new Error('Nome de tabela inválido.');
    for (const row of rows) {
      const columns = Object.keys(row);
      if (columns.some(column => !/^[a-z_]+$/.test(column))) throw new Error('Coluna inválida.');
      statements.push({
        sql: `INSERT INTO "${table}" (${columns.map(column => `"${column}"`).join(',')}) VALUES (${columns.map(() => '?').join(',')})`,
        args: columns.map(column => typeof row[column] === 'object' && row[column] !== null ? JSON.stringify(row[column]) : row[column]),
      });
    }
  }
  await client.batch(statements, 'write');
  const count = await client.execute('SELECT COUNT(*) AS total FROM entries');
  console.log(`Banco importado. ${count.rows[0].total} cadastros preservados.`);
} finally {
  client.close();
}
