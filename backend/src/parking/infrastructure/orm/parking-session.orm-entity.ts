import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { VehicleOrmEntity } from '../../../vehicles/infrastructure/orm/vehicle.orm-entity';
import { TariffOrmEntity } from '../../../tariffs/infrastructure/orm/tariff.orm-entity';
import { UserOrmEntity } from '../../../users/infrastructure/orm/user.orm-entity';
import { MonthlyPassOrmEntity } from '../../../monthly-passes/infrastructure/orm/monthly-pass.orm-entity';
import { ParkingSpaceOrmEntity } from '../../../spaces/infrastructure/orm/parking-space.orm-entity';

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('parking_sessions')
export class ParkingSessionOrmEntity extends BaseEntity {
  @Column({ name: 'ticket_number', unique: true, length: 20 })
  ticketNumber: string;

  // --- Relaciones ---

  @ManyToOne(() => VehicleOrmEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleOrmEntity;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => TariffOrmEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'tariff_id' })
  tariff: TariffOrmEntity;

  @Column({ name: 'tariff_id' })
  tariffId: string;

  @ManyToOne(() => UserOrmEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'entry_by_id' })
  entryBy: UserOrmEntity;

  @Column({ name: 'entry_by_id' })
  entryById: string;

  @ManyToOne(() => UserOrmEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'exit_by_id' })
  exitBy: UserOrmEntity | null;

  @Column({ name: 'exit_by_id', nullable: true })
  exitById: string | null;

  @ManyToOne(() => MonthlyPassOrmEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'monthly_pass_id' })
  monthlyPass: MonthlyPassOrmEntity | null;

  @Column({ name: 'monthly_pass_id', nullable: true })
  monthlyPassId: string | null;

  @ManyToOne(() => ParkingSpaceOrmEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'space_id' })
  space: ParkingSpaceOrmEntity | null;

  @Column({ name: 'space_id', nullable: true })
  spaceId: string | null;

  // --- Tiempos ---

  @Column({ name: 'entry_time', type: 'timestamptz' })
  entryTime: Date;

  @Column({ name: 'exit_time', type: 'timestamptz', nullable: true })
  exitTime: Date | null;

  // --- Estado ---

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
