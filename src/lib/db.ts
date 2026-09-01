import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { env } from 'cloudflare:workers';

export type AppDb = DrizzleD1Database<typeof schema>;

export function getDb(customEnv?: CloudflareEnv): AppDb {
  const targetEnv = customEnv || (env as unknown as CloudflareEnv);
  const d1 = targetEnv?.bella_forever_db;
  if (!d1) {
    throw new Error('D1 binding bella_forever_db not found in Cloudflare env');
  }
  return drizzle(d1, { schema });
}

export { schema };

