import { Column, DeleteDateColumn, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/entities/base.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
  SUPERVISOR = 'SUPERVISOR',
}

@Entity('users')
export class UserOrmEntity extends BaseEntity {
  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CASHIER })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'refresh_token', nullable: true, type: 'text' })
  refreshToken: string | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;
}
