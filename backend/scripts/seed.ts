import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';

// Carga manual del .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const [key, ...rest] = line.trim().split('=');
    if (key && !key.startsWith('#') && rest.length) {
      process.env[key] = rest.join('=');
    }
  }
}

const ADMIN = {
  name: 'Administrador',
  email: 'admin@parking.com',
  password: 'Admin1234!',
};

const TARIFF = {
  name: 'General',
  pricePerHour: 1500,
  pricePerHalfHour: 800,
  toleranceMinutes: 10,
  dailyMax: 8000,
};

async function seed(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const passwordHash = await bcrypt.hash(ADMIN.password, 10);

    await client.query(
      `INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, 'ADMIN', true, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      [ADMIN.name, ADMIN.email, passwordHash],
    );

    await client.query(
      `INSERT INTO tariffs (
         id, name, price_per_hour, price_per_half_hour, tolerance_minutes,
         daily_max, overnight_rate, overnight_start_hour, overnight_end_hour,
         is_active, effective_from, created_at, updated_at
       )
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NULL, 22, 8, true, NOW(), NOW(), NOW())
       ON CONFLICT DO NOTHING`,
      [TARIFF.name, TARIFF.pricePerHour, TARIFF.pricePerHalfHour, TARIFF.toleranceMinutes, TARIFF.dailyMax],
    );

    // Espacios: A1-A5 (CAR), B1-B5 (CAR), C1-C5 (CAR), D1-D5 (MOTORCYCLE), E1-E5 (DISABLED)
    const spaces: { code: string; type: string }[] = [
      ...Array.from({ length: 5 }, (_, i) => ({ code: `A${i + 1}`, type: 'CAR' })),
      ...Array.from({ length: 5 }, (_, i) => ({ code: `B${i + 1}`, type: 'CAR' })),
      ...Array.from({ length: 5 }, (_, i) => ({ code: `C${i + 1}`, type: 'CAR' })),
      ...Array.from({ length: 5 }, (_, i) => ({ code: `D${i + 1}`, type: 'MOTORCYCLE' })),
      ...Array.from({ length: 5 }, (_, i) => ({ code: `E${i + 1}`, type: 'DISABLED' })),
    ];

    // Limpiar espacios que no están en la lista definitiva y no tienen sesiones asociadas
    const codes = spaces.map(s => s.code)
    await client.query(
      `DELETE FROM parking_spaces
       WHERE code != ALL($1::text[])
         AND id NOT IN (SELECT DISTINCT space_id FROM parking_sessions WHERE space_id IS NOT NULL)`,
      [codes],
    )

    for (const space of spaces) {
      await client.query(
        `INSERT INTO parking_spaces (id, code, type, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'AVAILABLE', NOW(), NOW())
         ON CONFLICT (code) DO NOTHING`,
        [space.code, space.type],
      );
    }

    console.log('Seed completado:');
    console.log(`  email:    ${ADMIN.email}`);
    console.log(`  password: ${ADMIN.password}`);
    console.log(`  role:     ADMIN`);
    console.log(`  tarifa:   ${TARIFF.name} — $${TARIFF.pricePerHour}/h`);
    console.log(`  espacios: ${spaces.length} (A1-A5, B1-B5, C1-C5, D1-D5, E1-E5)`);
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error('Error en seed:', err.message);
  process.exit(1);
});
