import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentOrmEntity } from './infrastructure/orm/payment.orm-entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentOrmRepository } from './infrastructure/orm/payment-orm.repository';
import { PAYMENT_REPOSITORY } from './ports/payment-repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentOrmEntity])],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PAYMENT_REPOSITORY, useClass: PaymentOrmRepository },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
