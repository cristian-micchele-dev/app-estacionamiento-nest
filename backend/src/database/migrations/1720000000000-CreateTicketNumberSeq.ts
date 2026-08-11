import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTicketNumberSeq1720000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SEQUENCE IF EXISTS ticket_number_seq`);
  }
}
