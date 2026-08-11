import { PaginationDto, PaginatedResult } from '../../shared/dto/pagination.dto';
import {
  ParkingSessionOrmEntity,
  SessionStatus,
} from '../infrastructure/orm/parking-session.orm-entity';

export interface SessionStats {
  activeCount: number;
  completedToday: number;
  avgDurationMinutes: number;
  revenueToday: number;
}

export const SESSION_REPOSITORY = Symbol('ISessionRepository');

export interface ISessionRepository {
  findAll(
    pagination: PaginationDto,
    status?: SessionStatus,
  ): Promise<PaginatedResult<ParkingSessionOrmEntity>>;
  findOne(id: string): Promise<ParkingSessionOrmEntity | null>;
  findByTicketNumber(ticketNumber: string): Promise<ParkingSessionOrmEntity | null>;
  findActiveByVehicle(vehicleId: string): Promise<ParkingSessionOrmEntity | null>;
  save(entity: ParkingSessionOrmEntity): Promise<ParkingSessionOrmEntity>;
  create(data: Partial<ParkingSessionOrmEntity>): ParkingSessionOrmEntity;
  getStats(): Promise<SessionStats>;
  nextTicketNumber(): Promise<string>;
}
