import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { TicketOrmEntity } from '../../../tickets/infrastructure/orm/ticket.orm-entity';
import { UserOrmEntity } from '../../../users/infrastructure/orm/user.orm-entity';
import { ShiftOrmEntity } from '../../../shifts/infrastructure/orm/shift.orm-entity';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  MONTHLY_PASS = 'MONTHLY_PASS',
}

@Entity('payments')
export class PaymentOrmEntity extends BaseEntity {
  @ManyToOne(() => TicketOrmEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'ticket_id' })
  ticket: TicketOrmEntity;

  @Column({ name: 'ticket_id' })
  ticketId: string;

  @ManyToOne(() => ShiftOrmEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'shift_id' })
  shift: ShiftOrmEntity | null;

  @Column({ name: 'shift_id', nullable: true })
  shiftId: string | null;

  @ManyToOne(() => UserOrmEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'processed_by_id' })
  processedBy: UserOrmEntity;

  @Column({ name: 'processed_by_id' })
  processedById: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({
    name: 'received_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  receivedAmount: number | null;

  @Column({
    name: 'change_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  changeAmount: number | null;

  @Column({ name: 'paid_at', type: 'timestamptz' })
  paidAt: Date;
}
