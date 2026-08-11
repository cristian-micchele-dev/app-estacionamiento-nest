import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTariffDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(0)
  pricePerHour: number;

  @IsNumber()
  @Min(0)
  pricePerHalfHour: number;

  @IsNumber()
  @Min(0)
  @Max(60)
  @IsOptional()
  toleranceMinutes?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  dailyMax?: number | null;

  @IsNumber()
  @Min(0)
  @IsOptional()
  overnightRate?: number | null;

  @IsNumber()
  @Min(0)
  @Max(23)
  @IsOptional()
  overnightStartHour?: number;

  @IsNumber()
  @Min(0)
  @Max(23)
  @IsOptional()
  overnightEndHour?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDateString()
  effectiveFrom: string;

  @IsDateString()
  @IsOptional()
  effectiveTo?: string | null;
}
