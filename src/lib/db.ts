import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { env } from 'cloudflare:workers';

export function getDb(customEnv?: any) {
  const targetEnv = customEnv || env;
  const d1 = targetEnv?.bella_forever_db;
  if (!d1) {
    throw new Error('D1 binding bella_forever_db not found in Cloudflare env');
  }
  return drizzle(d1, { schema });
}

export { schema };
