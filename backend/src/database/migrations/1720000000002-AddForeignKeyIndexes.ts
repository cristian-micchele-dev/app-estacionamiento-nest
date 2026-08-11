import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForeignKeyIndexes1720000000002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // tickets.session_id — usado en checkout(), pay(), findBySession()
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_session_id
      ON tickets (session_id)
    `);

    // payments.ticket_id — usado en ShiftsService.close() (join) y findByTicket
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_ticket_id
      ON payments (ticket_id)
    `);

    // payments.shift_id — usado en PaymentsService.findByShift()
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_shift_id
      ON payments (shift_id)
    `);

    // parking_sessions.vehicle_id — usado en findActiveByVehicle()
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parking_sessions_vehicle_id
      ON parking_sessions (vehicle_id)
    `);

    // monthly_passes.vehicle_id — usado en findActiveByVehicle()
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monthly_passes_vehicle_id
      ON monthly_passes (vehicle_id)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_tickets_session_id`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_payments_ticket_id`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_payments_shift_id`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_parking_sessions_vehicle_id`);
    await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS idx_monthly_passes_vehicle_id`);
  }
}
