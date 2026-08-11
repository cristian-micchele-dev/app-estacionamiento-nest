import {
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../../payments/infrastructure/orm/payment.orm-entity';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export class PayTicketDto {
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
  @MaxLength(500)
  notes?: string;

  @IsIn(['PERCENTAGE', 'FIXED'])
  @IsOptional()
  discountType?: DiscountType;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;
}
