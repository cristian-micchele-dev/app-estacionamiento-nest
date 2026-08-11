import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    autoLoadEntities: true,
    // synchronize solo en dev como red de seguridad para cambios rápidos en entidades.
    // Las migraciones son el mecanismo oficial y se ejecutan en TODOS los entornos.
    synchronize: process.env.NODE_ENV === 'development',
    migrations: [__dirname + '/../../database/migrations/*.{ts,js}'],
    migrationsRun: true,
    ssl:
      process.env.DATABASE_URL?.includes('supabase') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : false,
  }),
);
