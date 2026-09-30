import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const { Pool } = pg;

let realPool: pg.Pool | null = null;
let pgliteInstance: PGlite | null = null;
let activeEngine: 'pg' | 'pglite' | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Initialize database connection:
 * Attempts connecting to PostgreSQL. If unavailable or ECONNREFUSED,
 * seamlessly falls back to embedded PGlite with local file persistence.
 */
export async function initDb(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const connectionString = config.db.connectionString;
    const isCustomUrl = !!process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost:5432');

    let pgConnected = false;

    if (process.env.USE_PGLITE !== 'true') {
      try {
        const testPool = new Pool({
          connectionString,
          max: 2,
          connectionTimeoutMillis: 1500,
        });

        const testClient = await testPool.connect();
        await testClient.query('SELECT 1');
        testClient.release();
        await testPool.end();

        realPool = new Pool({
          connectionString,
          max: config.db.maxPool,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        });

        realPool.on('error', (err) => {
          console.error('[PostgreSQL Pool Error]:', err);
        });

        activeEngine = 'pg';
        pgConnected = true;
        console.log(`[Database] Connected to external PostgreSQL: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);
      } catch (err: any) {
        if (isCustomUrl) {
          console.warn(`[Database] Notice: Could not connect to custom PostgreSQL (${err.message}). Falling back to embedded PGlite.`);
        }
      }
    }

    if (!pgConnected) {
      activeEngine = 'pglite';
      const dataDir = path.resolve(process.cwd(), 'server', 'db', '.pgdata');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      pgliteInstance = new PGlite(dataDir);
      await pgliteInstance.waitReady;
      console.log(`[Database] Using embedded PGlite engine (persisted at: ${dataDir})`);
    }

    // Verify schema and auto-run seeds if first boot
    await ensureSchemaAndSeeds();
  })();

  return initPromise;
}

async function ensureSchemaAndSeeds(): Promise<void> {
  try {
    const checkRes = await query(`
      SELECT count(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    const count = parseInt(checkRes.rows[0]?.count || '0', 10);
    if (count === 0) {
      console.log('[Database] Tables not found. Initializing schema and default demo data...');
      const { runMigration } = await import('./migrate');
      await runMigration();
      console.log('[Database] Schema and demo accounts seeded successfully!');
    }
  } catch (err) {
    console.error('[Database] Warning checking/initializing schema:', err);
  }
}

export async function query<T = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  if (!activeEngine) {
    await initDb();
  }

  const start = Date.now();
  try {
    if (activeEngine === 'pg' && realPool) {
      const res = await realPool.query<T>(text, params);
      const duration = Date.now() - start;
      if (process.env.DEBUG_SQL === 'true') {
        console.log(`[SQL Query] (${duration}ms):`, text, params);
      }
      return res;
    } else {
      if (!pgliteInstance) throw new Error('PGlite engine not ready');
      
      // If multiple SQL statements without parameters, use exec
      if ((!params || params.length === 0) && text.trim().split(';').filter(s => s.trim()).length > 1) {
        await pgliteInstance.exec(text);
        return {
          rows: [] as T[],
          rowCount: 0,
          command: '',
          oid: 0,
          fields: [],
        };
      }

      const res = await pgliteInstance.query(text, params);
      const duration = Date.now() - start;
      if (process.env.DEBUG_SQL === 'true') {
        console.log(`[SQL Query (PGlite)] (${duration}ms):`, text, params);
      }
      return {
        rows: res.rows as T[],
        rowCount: res.affectedRows ?? res.rows.length,
        command: '',
        oid: 0,
        fields: (res.fields || []).map((f: any) => ({
          name: f.name,
          tableID: 0,
          columnID: 0,
          dataTypeID: f.dataTypeID || 0,
          dataTypeSize: 0,
          dataTypeModifier: 0,
          format: 'text',
        })),
      };
    }
  } catch (err) {
    console.error(`[SQL Error] in query: "${text.substring(0, 100)}...":`, err);
    throw err;
  }
}

/**
 * Execute raw multi-statement SQL script (DDL / migrations).
 */
export async function exec(sql: string): Promise<void> {
  if (!activeEngine) {
    await initDb();
  }
  if (activeEngine === 'pg' && realPool) {
    await realPool.query(sql);
  } else {
    if (!pgliteInstance) throw new Error('PGlite engine not ready');
    await pgliteInstance.exec(sql);
  }
}

/**
 * Execute a sequence of database operations within an ACID transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK.
 */
export async function withTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  if (!activeEngine) {
    await initDb();
  }

  if (activeEngine === 'pg' && realPool) {
    const client = await realPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    if (!pgliteInstance) throw new Error('PGlite engine not ready');
    return await pgliteInstance.transaction(async (tx) => {
      const txClient = {
        query: async (text: string, params?: any[]) => {
          const res = await tx.query(text, params);
          return {
            rows: res.rows,
            rowCount: res.affectedRows ?? res.rows.length,
            fields: res.fields,
          };
        },
      };
      return await callback(txClient);
    });
  }
}

export const pool = {
  query: (text: string, params?: any[]) => query(text, params),
  connect: async () => {
    if (!activeEngine) await initDb();
    if (activeEngine === 'pg' && realPool) {
      return await realPool.connect();
    }
    return {
      query: (text: string, params?: any[]) => query(text, params),
      release: () => {},
    };
  },
  end: async () => {
    if (realPool) await realPool.end();
    if (pgliteInstance) await pgliteInstance.close();
  },
  on: (event: any, handler: (...args: any[]) => void) => {
    if (realPool) (realPool as any).on(event, handler);
  },
};
