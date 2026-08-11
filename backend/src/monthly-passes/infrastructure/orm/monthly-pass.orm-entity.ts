import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { VehicleOrmEntity } from '../../../vehicles/infrastructure/orm/vehicle.orm-entity';

@Entity('monthly_passes')
export class MonthlyPassOrmEntity extends BaseEntity {
  @ManyToOne(() => VehicleOrmEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleOrmEntity;

  @Column({ name: 'vehicle_id' })
  vehicleId: string;

  @Column({ name: 'holder_name', length: 150 })
  holderName: string;

  @Column({ name: 'holder_phone', length: 30, nullable: true })
  holderPhone: string | null;

  @Column({ name: 'holder_email', length: 150, nullable: true })
  holderEmail: string | null;

  @Column({ name: 'valid_from', type: 'date' })
  validFrom: string;

  @Column({ name: 'valid_to', type: 'date' })
  validTo: string;

  @Column({ name: 'price_paid', type: 'decimal', precision: 10, scale: 2 })
  pricePaid: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
