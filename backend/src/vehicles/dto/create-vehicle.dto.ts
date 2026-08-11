import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { VehicleType } from '../infrastructure/orm/vehicle.orm-entity';

// Argentina: viejo AAA000 | Mercosur AA000AA
const PLATE_REGEX = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).toUpperCase().replace(/\s+/g, ''))
  @Matches(PLATE_REGEX, { message: 'INVALID_PLATE_FORMAT' })
  plate: string;

  @IsEnum(VehicleType)
  @IsOptional()
  type?: VehicleType;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  brand?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  color?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  observations?: string | null;
}
