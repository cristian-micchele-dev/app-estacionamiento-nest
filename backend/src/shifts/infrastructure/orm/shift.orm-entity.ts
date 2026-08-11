import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';
import { UserOrmEntity } from '../../../users/infrastructure/orm/user.orm-entity';
import { PaymentOrmEntity } from '../../../payments/infrastructure/orm/payment.orm-entity';

export enum ShiftStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

@Entity('shifts')
export class ShiftOrmEntity extends BaseEntity {
  @ManyToOne(() => UserOrmEntity, { nullable: false, eager: false })
  @JoinColumn({ name: 'cashier_id' })
  cashier: UserOrmEntity;

  @Column({ name: 'cashier_id' })
  cashierId: string;

  @Column({ name: 'opened_at', type: 'timestamptz' })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @Column({
    name: 'opening_balance',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  openingBalance: number;

  // Lo que el cajero dice que hay en caja al cerrar
  @Column({
    name: 'closing_balance_counted',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  closingBalanceCounted: number | null;

  // Lo que el sistema dice que debería haber
  @Column({
    name: 'closing_balance_system',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  closingBalanceSystem: number | null;

  // Diferencia entre contado y sistema (sobrante + / faltante -)
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  difference: number | null;

  @Column({ type: 'enum', enum: ShiftStatus, default: ShiftStatus.OPEN })
  status: ShiftStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => PaymentOrmEntity, (payment) => payment.shift)
  payments: PaymentOrmEntity[];
}
