import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  TicketOrmEntity,
  TicketStatus,
} from './infrastructure/orm/ticket.orm-entity';
import { ITicketRepository, TICKET_REPOSITORY } from './ports/ticket-repository.port';
import {
  ParkingSessionOrmEntity,
  SessionStatus,
} from '../parking/infrastructure/orm/parking-session.orm-entity';
import {
  PaymentMethod,
  PaymentOrmEntity,
} from '../payments/infrastructure/orm/payment.orm-entity';
import { ParkingExitService } from '../parking/parking-exit.service';
import { PaginatedResult } from '../shared/dto/pagination.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { PayTicketDto } from './dto/pay-ticket.dto';
import { ParkingEventsService } from '../parking/parking-events.service';

export interface PayTicketResult {
  ticket: TicketOrmEntity;
  session: ParkingSessionOrmEntity;
}

export interface CreateTicketParams {
  sessionId: string;
  durationMinutes: number;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  status: TicketStatus;
}

@Injectable()
export class TicketsService {
  constructor(
    @Inject(TICKET_REPOSITORY)
    private readonly repo: ITicketRepository,
    private readonly dataSource: DataSource,
    private readonly exitService: ParkingExitService,
    private readonly eventsService: ParkingEventsService,
  ) {}

  findAll(query: TicketQueryDto): Promise<PaginatedResult<TicketOrmEntity>> {
    const { page, limit, search, status, dateFrom, dateTo, all } = query;
    return this.repo.findAll({ page, limit }, { search, status, dateFrom, dateTo, all });
  }

  async findOne(id: string): Promise<TicketOrmEntity> {
    const ticket = await this.repo.findOne(id);
    if (!ticket) throw new NotFoundException('TICKET_NOT_FOUND');
    return ticket;
  }

  findBySession(sessionId: string): Promise<TicketOrmEntity | null> {
    return this.repo.findBySession(sessionId);
  }

  async cancel(id: string): Promise<TicketOrmEntity> {
    const ticket = await this.repo.findOne(id);
    if (!ticket) throw new NotFoundException('TICKET_NOT_FOUND');
    if (ticket.status !== TicketStatus.PENDING)
      throw new BadRequestException('TICKET_NOT_CANCELLABLE');
    ticket.status = TicketStatus.CANCELLED;
    return this.repo.save(ticket as Partial<TicketOrmEntity>);
  }

  async pay(
    ticketId: string,
    dto: PayTicketDto,
    userId: string,
  ): Promise<PayTicketResult> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const ticket = await qr.manager.findOne(TicketOrmEntity, {
        where: { id: ticketId },
      });

      if (!ticket) throw new NotFoundException('TICKET_NOT_FOUND');
      if (ticket.status !== TicketStatus.PENDING)
        throw new BadRequestException('TICKET_NOT_PAYABLE');

      const session = await qr.manager.findOne(ParkingSessionOrmEntity, {
        where: { id: ticket.sessionId },
      });

      if (!session) throw new NotFoundException('SESSION_NOT_FOUND');
      if (session.status !== SessionStatus.ACTIVE)
        throw new BadRequestException('SESSION_NOT_ACTIVE');

      const hasMonthlyPass = session.monthlyPassId !== null;
      const paymentMethod = hasMonthlyPass
        ? PaymentMethod.MONTHLY_PASS
        : dto.paymentMethod;

      const discountAmount = hasMonthlyPass
        ? 0
        : this.applyDiscount(Number(ticket.subtotal), dto);
      const totalAmount = Number(ticket.subtotal) - discountAmount;

      if (paymentMethod === PaymentMethod.CASH) {
        if (dto.receivedAmount == null)
          throw new BadRequestException('RECEIVED_AMOUNT_REQUIRED_FOR_CASH');
        if (dto.receivedAmount < totalAmount)
          throw new BadRequestException('RECEIVED_AMOUNT_INSUFFICIENT');
      }

      ticket.discountAmount = discountAmount;
      ticket.totalAmount    = totalAmount;
      ticket.status         = TicketStatus.PAID;
      const updatedTicket = await qr.manager.save(ticket);

      await qr.manager.save(
        qr.manager.create(PaymentOrmEntity, {
          ticketId:       ticket.id,
          shiftId:        dto.shiftId ?? null,
          processedById:  userId,
          amount:         totalAmount,
          method:         paymentMethod,
          receivedAmount: hasMonthlyPass ? null : (dto.receivedAmount ?? null),
          changeAmount:
            hasMonthlyPass
              ? null
              : dto.receivedAmount != null
              ? dto.receivedAmount - totalAmount
              : null,
          paidAt: new Date(),
        }),
      );

      const updatedSession = await this.exitService.closeSession(
        ticket.sessionId,
        userId,
        dto.notes,
        qr.manager,
      );

      await qr.commitTransaction();
      this.eventsService.emit('SESSION_UPDATED');
      return { ticket: updatedTicket, session: updatedSession };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  create(params: CreateTicketParams): Promise<TicketOrmEntity> {
    return this.repo.save(params);
  }

  // ─── Descuentos ───────────────────────────────────────────────────────────────

  private applyDiscount(subtotal: number, dto: PayTicketDto): number {
    if (!dto.discountType || dto.discountValue == null || subtotal === 0)
      return 0;

    if (dto.discountType === 'PERCENTAGE') {
      if (dto.discountValue < 0 || dto.discountValue > 100)
        throw new BadRequestException('DISCOUNT_PERCENTAGE_OUT_OF_RANGE');
      return Math.round(subtotal * 100 * dto.discountValue / 100) / 100;
    }

    if (dto.discountValue > subtotal)
      throw new BadRequestException('DISCOUNT_EXCEEDS_SUBTOTAL');
    return dto.discountValue;
  }
}
