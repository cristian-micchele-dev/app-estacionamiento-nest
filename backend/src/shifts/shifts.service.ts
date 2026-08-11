import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ShiftOrmEntity, ShiftStatus } from './infrastructure/orm/shift.orm-entity';
import { IShiftRepository, SHIFT_REPOSITORY } from './ports/shift-repository.port';
import { PaymentsService } from '../payments/payments.service';
import { PaymentMethod } from '../payments/infrastructure/orm/payment.orm-entity';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { PaginatedResult, PaginationDto } from '../shared/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/infrastructure/orm/audit-log.orm-entity';

@Injectable()
export class ShiftsService {
  private readonly logger = new Logger(ShiftsService.name);

  constructor(
    @Inject(SHIFT_REPOSITORY)
    private readonly repo: IShiftRepository,
    private readonly paymentsService: PaymentsService,
    private readonly auditService: AuditService,
  ) {}

  findAll(pagination: PaginationDto): Promise<PaginatedResult<ShiftOrmEntity>> {
    return this.repo.findAll(pagination);
  }

  findActive(): Promise<ShiftOrmEntity | null> {
    return this.repo.findActive();
  }

  async open(cashierId: string, dto: OpenShiftDto): Promise<ShiftOrmEntity> {
    const existing = await this.findActive();
    if (existing) throw new BadRequestException('SHIFT_ALREADY_OPEN');
    const shift = await this.repo.save(
      this.repo.create({
        cashierId,
        openingBalance: dto.openingBalance,
        openedAt: new Date(),
        status: ShiftStatus.OPEN,
      }),
    );
    this.auditService.log({
      userId: cashierId,
      action: AuditAction.SHIFT_OPENED,
      entityType: 'shift',
      entityId: shift.id,
      metadata: { openingBalance: dto.openingBalance },
    }).catch((err) => this.logger.error('Audit log failed (SHIFT_OPENED)', err));
    return shift;
  }

  async close(shiftId: string, dto: CloseShiftDto): Promise<ShiftOrmEntity> {
    const shift = await this.repo.findOne(shiftId);
    if (!shift) throw new NotFoundException('SHIFT_NOT_FOUND');
    if (shift.status !== ShiftStatus.OPEN)
      throw new BadRequestException('SHIFT_ALREADY_CLOSED');

    const payments = await this.paymentsService.findByShift(shiftId);
    // Solo los pagos en efectivo afectan el saldo de caja.
    // Tarjeta, transferencia y abono mensual no ingresan al cajón.
    const totalCashPayments = payments
      .filter((p) => p.method === PaymentMethod.CASH)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const systemBalance = Number(shift.openingBalance) + totalCashPayments;

    shift.status = ShiftStatus.CLOSED;
    shift.closedAt = new Date();
    shift.closingBalanceCounted = dto.closingBalanceCounted;
    shift.closingBalanceSystem = systemBalance;
    shift.difference = dto.closingBalanceCounted - systemBalance;
    shift.notes = dto.notes ?? null;

    const saved = await this.repo.save(shift);
    this.auditService.log({
      userId: shift.cashierId,
      action: AuditAction.SHIFT_CLOSED,
      entityType: 'shift',
      entityId: shiftId,
      metadata: { difference: shift.difference, systemBalance: systemBalance },
    }).catch((err) => this.logger.error('Audit log failed (SHIFT_CLOSED)', err));
    return saved;
  }
}
