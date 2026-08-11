import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserOrmEntity } from '../../../users/infrastructure/orm/user.orm-entity';

export enum AuditAction {
  VEHICLE_ENTRY = 'VEHICLE_ENTRY',
  VEHICLE_EXIT = 'VEHICLE_EXIT',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  SHIFT_OPENED = 'SHIFT_OPENED',
  SHIFT_CLOSED = 'SHIFT_CLOSED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  TARIFF_CREATED = 'TARIFF_CREATED',
  TARIFF_UPDATED = 'TARIFF_UPDATED',
  TICKET_CANCELLED = 'TICKET_CANCELLED',
  MONTHLY_PASS_CREATED = 'MONTHLY_PASS_CREATED',
  MONTHLY_PASS_RENEWED = 'MONTHLY_PASS_RENEWED',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

@Entity('audit_logs')
export class AuditLogOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserOrmEntity, { nullable: true, eager: false })
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity | null;

  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ name: 'entity_type', length: 50 })
  entityType: string;

  @Column({ name: 'entity_id', length: 100 })
  entityId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
