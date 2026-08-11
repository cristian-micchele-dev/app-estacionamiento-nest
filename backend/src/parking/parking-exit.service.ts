import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  ParkingSessionOrmEntity,
  SessionStatus,
} from './infrastructure/orm/parking-session.orm-entity';
import {
  TicketOrmEntity,
  TicketStatus,
} from '../tickets/infrastructure/orm/ticket.orm-entity';
import { TariffOrmEntity } from '../tariffs/infrastructure/orm/tariff.orm-entity';
import {
  ParkingSpaceOrmEntity,
  SpaceStatus,
} from '../spaces/infrastructure/orm/parking-space.orm-entity';

@Injectable()
export class ParkingExitService {
  constructor(private readonly dataSource: DataSource) {}

  async checkout(sessionId: string): Promise<TicketOrmEntity> {
    const sessionRepo = this.dataSource.getRepository(ParkingSessionOrmEntity);

    const session = await sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['vehicle', 'tariff'],
    });

    if (!session) throw new NotFoundException('SESSION_NOT_FOUND');
    if (session.status !== SessionStatus.ACTIVE)
      throw new BadRequestException('SESSION_NOT_ACTIVE');

    // Wrap check + creation in a transaction to prevent duplicate tickets
    // when two concurrent exit requests arrive for the same session.
    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(TicketOrmEntity, {
        where: { sessionId, status: TicketStatus.PENDING },
      });
      if (existing) return existing;

      const now = new Date();
      const durationMinutes = Math.floor(
        (now.getTime() - session.entryTime.getTime()) / 60000,
      );

      const hasMonthlyPass = session.monthlyPassId !== null;
      const subtotal = hasMonthlyPass
        ? 0
        : this.calculateAmount(session.entryTime, now, session.tariff);

      return manager.save(
        manager.create(TicketOrmEntity, {
          sessionId: session.id,
          durationMinutes,
          subtotal,
          discountAmount: 0,
          totalAmount: subtotal,
          status: TicketStatus.PENDING,
        }),
      );
    });
  }

  /**
   * Cierra la sesión y libera el espacio dentro de un EntityManager externo
   * (llamado desde TicketsService.pay() dentro de su propia transacción).
   */
  async closeSession(
    sessionId: string,
    userId: string,
    notes: string | undefined,
    manager: EntityManager,
  ): Promise<ParkingSessionOrmEntity> {
    const session = await manager.findOne(ParkingSessionOrmEntity, {
      where: { id: sessionId },
    });

    if (!session) throw new NotFoundException('SESSION_NOT_FOUND');

    session.status   = SessionStatus.COMPLETED;
    session.exitTime = new Date();
    session.exitById = userId;
    if (notes) session.notes = notes;

    const saved = await manager.save(session);

    if (session.spaceId) {
      await manager.update(ParkingSpaceOrmEntity, session.spaceId, {
        status: SpaceStatus.AVAILABLE,
      });
    }

    return saved;
  }

  // ─── Cálculo de tarifa ────────────────────────────────────────────────────────

  /**
   * Calcula el monto a cobrar por una sesión.
   *
   * Reglas:
   * 1. Si la duración cae dentro del período de tolerancia → $0.
   * 2. Los minutos facturables se dividen en bloques de 30 minutos (cada
   *    fracción iniciada se cobra completa).
   * 3. Si la tarifa tiene `overnightRate`, los minutos nocturnos se cobran
   *    a esa tasa (÷ 2 por bloque de 30 min); los diurnos a `pricePerHalfHour`.
   *    Sin `overnightRate`, todos los minutos usan `pricePerHalfHour`.
   * 4. El total se limita a `dailyMax` si está definido.
   */
  private calculateAmount(
    entryTime: Date,
    exitTime: Date,
    tariff: TariffOrmEntity,
  ): number {
    const totalMinutes = Math.floor(
      (exitTime.getTime() - entryTime.getTime()) / 60000,
    );

    if (totalMinutes <= tariff.toleranceMinutes) return 0;

    // Los primeros `toleranceMinutes` son gratuitos — movemos el inicio de facturación
    const billableFrom = new Date(
      entryTime.getTime() + tariff.toleranceMinutes * 60000,
    );
    const billableMinutes = totalMinutes - tariff.toleranceMinutes;

    let amountCents: number;

    if (tariff.overnightRate !== null) {
      const { daytimeMinutes, overnightMinutes } = this.splitDaytimeOvernight(
        billableFrom,
        exitTime,
        tariff.overnightStartHour,
        tariff.overnightEndHour,
      );

      const daytimeBlocks  = daytimeMinutes  > 0 ? Math.ceil(daytimeMinutes  / 30) : 0;
      const overnightBlocks = overnightMinutes > 0 ? Math.ceil(overnightMinutes / 30) : 0;

      const halfHourCents         = Math.round(Number(tariff.pricePerHalfHour) * 100);
      const overnightHalfHourCents = Math.round((Number(tariff.overnightRate) / 2) * 100);

      amountCents = daytimeBlocks * halfHourCents + overnightBlocks * overnightHalfHourCents;
    } else {
      const blocks       = Math.ceil(billableMinutes / 30);
      const halfHourCents = Math.round(Number(tariff.pricePerHalfHour) * 100);
      amountCents = blocks * halfHourCents;
    }

    const dailyMaxCents =
      tariff.dailyMax !== null
        ? Math.round(Number(tariff.dailyMax) * 100)
        : null;

    if (dailyMaxCents !== null && amountCents > dailyMaxCents) {
      amountCents = dailyMaxCents;
    }

    return amountCents / 100;
  }

  /**
   * Divide el rango [from, to] en minutos diurnos y nocturnos.
   *
   * La franja nocturna cruza la medianoche: [overnightStartHour, 24) ∪ [0, overnightEndHour).
   * Se itera por cada día calendario dentro del rango y se acumula el solapamiento
   * con las dos ventanas nocturnas de ese día.
   */
  private splitDaytimeOvernight(
    from: Date,
    to: Date,
    overnightStartHour: number,
    overnightEndHour: number,
  ): { daytimeMinutes: number; overnightMinutes: number } {
    const totalMinutes = Math.floor((to.getTime() - from.getTime()) / 60000);
    let overnightMinutes = 0;

    const fromDay = new Date(from);
    fromDay.setHours(0, 0, 0, 0);

    const toDay = new Date(to);
    toDay.setHours(0, 0, 0, 0);

    for (
      let day = new Date(fromDay);
      day <= toDay;
      day.setDate(day.getDate() + 1)
    ) {
      // Ventana nocturna 1: overnightStartHour → medianoche
      const w1Start = new Date(day);
      w1Start.setHours(overnightStartHour, 0, 0, 0);
      const w1End = new Date(day);
      w1End.setDate(w1End.getDate() + 1);
      w1End.setHours(0, 0, 0, 0);
      overnightMinutes += this.overlapMinutes(from, to, w1Start, w1End);

      // Ventana nocturna 2: medianoche → overnightEndHour
      const w2Start = new Date(day);
      w2Start.setHours(0, 0, 0, 0);
      const w2End = new Date(day);
      w2End.setHours(overnightEndHour, 0, 0, 0);
      overnightMinutes += this.overlapMinutes(from, to, w2Start, w2End);
    }

    return {
      overnightMinutes,
      daytimeMinutes: totalMinutes - overnightMinutes,
    };
  }

  /** Minutos de solapamiento entre [a1, a2) y [b1, b2). */
  private overlapMinutes(a1: Date, a2: Date, b1: Date, b2: Date): number {
    const start = Math.max(a1.getTime(), b1.getTime());
    const end   = Math.min(a2.getTime(), b2.getTime());
    return start < end ? Math.floor((end - start) / 60000) : 0;
  }
}
