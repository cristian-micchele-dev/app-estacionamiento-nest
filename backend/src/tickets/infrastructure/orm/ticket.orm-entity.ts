import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { ParkingSessionOrmEntity } from '../../../parking/infrastructure/orm/parking-session.orm-entity';

export enum TicketStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('tickets')
export class TicketOrmEntity extends BaseEntity {
  @OneToOne(() => ParkingSessionOrmEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'session_id' })
  session: ParkingSessionOrmEntity;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discountAmount: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.PENDING,
  })
  status: TicketStatus;
}
