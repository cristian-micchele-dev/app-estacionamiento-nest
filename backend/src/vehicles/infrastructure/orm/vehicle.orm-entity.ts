import { Column, DeleteDateColumn, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

export enum VehicleType {
  CAR = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  TRUCK = 'TRUCK',
  VAN = 'VAN',
  BUS = 'BUS',
}

@Entity('vehicles')
export class VehicleOrmEntity extends BaseEntity {
  @Column({ unique: true, length: 20 })
  plate: string;

  @Column({ type: 'enum', enum: VehicleType, default: VehicleType.CAR })
  type: VehicleType;

  @Column({ length: 100, nullable: true })
  brand: string | null;

  @Column({ length: 50, nullable: true })
  color: string | null;

  @Column({ type: 'text', nullable: true })
  observations: string | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
