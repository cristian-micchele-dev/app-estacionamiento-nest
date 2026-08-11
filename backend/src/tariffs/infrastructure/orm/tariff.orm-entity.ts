import { Column, DeleteDateColumn, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

@Entity('tariffs')
export class TariffOrmEntity extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ name: 'price_per_hour', type: 'decimal', precision: 10, scale: 2 })
  pricePerHour: number;

  @Column({
    name: 'price_per_half_hour',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  pricePerHalfHour: number;

  @Column({ name: 'tolerance_minutes', type: 'int', default: 10 })
  toleranceMinutes: number;

  @Column({
    name: 'daily_max',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  dailyMax: number | null;

  @Column({
    name: 'overnight_rate',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  overnightRate: number | null;

  @Column({ name: 'overnight_start_hour', type: 'int', default: 22 })
  overnightStartHour: number;

  @Column({ name: 'overnight_end_hour', type: 'int', default: 8 })
  overnightEndHour: number;

  @Column({ name: 'is_active', default: false })
  isActive: boolean;

  @Column({ name: 'effective_from', type: 'timestamptz' })
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'timestamptz', nullable: true })
  effectiveTo: Date | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
