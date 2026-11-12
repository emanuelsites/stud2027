import {createClient, type Client, type InValue, type ResultSet} from '@libsql/client';

let client: Client | undefined;

function connection(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error('Configure TURSO_DATABASE_URL antes de iniciar o site.');
    if (process.env.VERCEL && url.startsWith('file:')) {
      throw new Error('Configure um banco Turso remoto na Vercel.');
    }
    client = createClient({url, authToken: process.env.TURSO_AUTH_TOKEN});
  }
  return client;
}

function result<T>(value: ResultSet): D1Result<T> {
  return {
    results: value.rows.map(row => Object.fromEntries(Object.entries(row))) as T[],
    success: true,
    meta: {changes: value.rowsAffected},
  };
}

class Statement implements D1PreparedStatement {
  constructor(readonly sql: string, readonly args: InValue[] = []) {}

  bind(...values: unknown[]): Statement {
    return new Statement(this.sql, values.map(value => value === undefined ? null : value) as InValue[]);
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return result<T>(await connection().execute({sql: this.sql, args: this.args}));
  }

  async first<T = Record<string, unknown>>(column?: string): Promise<T | null> {
    const response = await this.all<Record<string, unknown>>();
    const row = response.results[0];
    return row ? (column ? row[column] as T : row as T) : null;
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return this.all<T>();
  }
}

const adapter: D1Database = {
  prepare(sql: string) { return new Statement(sql); },
  async batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]) {
    const queries = statements.map(statement => {
      if (!(statement instanceof Statement)) throw new Error('Consulta incompatível com o banco.');
      return {sql: statement.sql, args: statement.args};
    });
    // libSQL commits all statements atomically and rolls back a failed batch.
    return (await connection().batch(queries, 'write')).map(value => result<T>(value));
  },
};

export function database(): D1Database { return adapter; }
