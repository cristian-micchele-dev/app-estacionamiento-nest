import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [join(__dirname, '../**/*.orm-entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations/*.{ts,js}')],
  ssl:
    process.env.DATABASE_URL?.includes('supabase') ||
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
});
