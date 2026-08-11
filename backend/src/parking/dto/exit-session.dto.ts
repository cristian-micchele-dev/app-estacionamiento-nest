import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../../payments/infrastructure/orm/payment.orm-entity';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export class ExitSessionDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber()
  @Min(0)
  @IsOptional()
  receivedAmount?: number;

  @IsUUID()
  @IsOptional()
  shiftId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsIn(['PERCENTAGE', 'FIXED'])
  @IsOptional()
  discountType?: DiscountType;

  /**
   * Para PERCENTAGE: valor entre 0 y 100 (ej: 15 = 15%).
   * Para FIXED: monto absoluto a descontar (no puede superar el subtotal).
   * Se valida en ParkingExitService.
   */
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;
}
