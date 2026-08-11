import { TicketOrmEntity, TicketStatus } from '../infrastructure/orm/ticket.orm-entity';
import { PaginatedResult, PaginationDto } from '../../shared/dto/pagination.dto';

export const TICKET_REPOSITORY = Symbol('ITicketRepository');

export interface TicketFilters {
  search?: string;
  status?: TicketStatus;
  dateFrom?: string;
  dateTo?: string;
  all?: boolean;
}

export interface ITicketRepository {
  findAll(
    pagination: PaginationDto,
    filters?: TicketFilters,
  ): Promise<PaginatedResult<TicketOrmEntity>>;
  findOne(id: string): Promise<TicketOrmEntity | null>;
  findBySession(sessionId: string): Promise<TicketOrmEntity | null>;
  save(ticket: Partial<TicketOrmEntity>): Promise<TicketOrmEntity>;
}
