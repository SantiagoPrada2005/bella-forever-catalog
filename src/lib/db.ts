import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';

export function getDb(env?: any) {
  const d1 = env?.bella_forever_db;
  if (!d1) {
    throw new Error('D1 binding bella_forever_db not found in Cloudflare env');
  }
  return drizzle(d1, { schema });
}

export { schema };
