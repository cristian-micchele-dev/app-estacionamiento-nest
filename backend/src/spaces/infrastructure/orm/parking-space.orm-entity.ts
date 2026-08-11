import { Column, DeleteDateColumn, Entity } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

export enum SpaceType {
  CAR        = 'CAR',
  MOTORCYCLE = 'MOTORCYCLE',
  DISABLED   = 'DISABLED',
}

export enum SpaceStatus {
  AVAILABLE   = 'AVAILABLE',
  OCCUPIED    = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity('parking_spaces')
export class ParkingSpaceOrmEntity extends BaseEntity {
  @Column({ unique: true, length: 10 })
  code: string;

  @Column({ type: 'enum', enum: SpaceType, default: SpaceType.CAR })
  type: SpaceType;

  @Column({ type: 'enum', enum: SpaceStatus, default: SpaceStatus.AVAILABLE })
  status: SpaceStatus;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
