import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateMonthlyPassDto } from './create-monthly-pass.dto';

export class UpdateMonthlyPassDto extends PartialType(
  OmitType(CreateMonthlyPassDto, ['vehicleId'] as const),
) {}
