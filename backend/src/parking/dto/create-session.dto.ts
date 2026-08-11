import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { VehicleType } from '../../vehicles/infrastructure/orm/vehicle.orm-entity';

const PLATE_REGEX = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).toUpperCase().replace(/\s+/g, ''))
  @Matches(PLATE_REGEX, { message: 'INVALID_PLATE_FORMAT' })
  plate: string;

  @IsEnum(VehicleType)
  @IsOptional()
  vehicleType?: VehicleType;

  @IsUUID()
  tariffId: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 10)
  @Transform(({ value }) => String(value).toUpperCase())
  spaceCode: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
