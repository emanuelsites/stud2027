import {createClient} from '@libsql/client';
import {pbkdf2Sync, randomBytes, randomUUID} from 'node:crypto';

const {TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: authToken, ADMIN_USERNAME: username, ADMIN_PASSWORD: password} = process.env;
if (!url || !username || !password || password.length < 12) {
  throw new Error('Defina TURSO_DATABASE_URL, ADMIN_USERNAME e ADMIN_PASSWORD com pelo menos 12 caracteres no ambiente local.');
}
const client = createClient({url, authToken});
try {
  const normalized = username.trim().toLowerCase();
  const salt = randomBytes(16).toString('hex');
  const iterations = 100000;
  const hash = pbkdf2Sync(password, Buffer.from(salt, 'hex'), iterations, 32, 'sha256').toString('hex');
  await client.batch([
    {sql: 'INSERT INTO admin_users (id,username,password_hash,salt,iterations,active,created_at) VALUES (?,?,?,?,?,1,?) ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash,salt=excluded.salt,iterations=excluded.iterations,active=1', args: [randomUUID(), normalized, hash, salt, iterations, new Date().toISOString()]},
    {sql: 'DELETE FROM admin_sessions WHERE user_id IN (SELECT id FROM admin_users WHERE username=?)', args: [normalized]},
  ], 'write');
  console.log('Senha administrativa atualizada e sessões anteriores encerradas.');
} finally {
  client.close();
}
