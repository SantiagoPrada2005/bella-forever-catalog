import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

const CLOUDLARE_CONTEXT_SYMBOL = Symbol.for('__cloudflare-context__');

let dbInstance = null;

function getCloudflareEnv() {
  const ctx = globalThis[CLOUDLARE_CONTEXT_SYMBOL];
  if (!ctx) {
    // Fallback for non-Cloudflare environments
    if (process.env.bella_forever_db) return { bella_forever_db: process.env.bella_forever_db };
    return null;
  }
  return ctx.env;
}

function initDb() {
  const env = getCloudflareEnv();
  if (!env?.bella_forever_db) {
    throw new Error('D1 binding bella_forever_db not found in Cloudflare env');
  }
  dbInstance = drizzle(env.bella_forever_db, { schema });
  return dbInstance;
}

export function getDb() {
  if (dbInstance) return dbInstance;
  return initDb();
}
