import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParkingSessionsIndexes1720000000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Índice compuesto (status, entry_time):
    // Optimiza la query del dashboard que filtra por status = 'COMPLETED'
    // y luego hace range scan sobre entry_time.
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parking_sessions_status_entry_time
      ON parking_sessions (status, entry_time)
    `);

    // Índice simple en entry_time para queries de rango sin filtro de status.
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parking_sessions_entry_time
      ON parking_sessions (entry_time)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS idx_parking_sessions_status_entry_time`,
    );
    await queryRunner.query(
      `DROP INDEX CONCURRENTLY IF EXISTS idx_parking_sessions_entry_time`,
    );
  }
}
