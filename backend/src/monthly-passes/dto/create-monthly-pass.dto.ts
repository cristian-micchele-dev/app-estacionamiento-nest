import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMonthlyPassDto {
  @IsUUID()
  vehicleId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  holderName: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  holderPhone?: string | null;

  @IsEmail()
  @IsOptional()
  @MaxLength(254)
  holderEmail?: string | null;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validTo: string;

  @IsNumber()
  @Min(0)
  pricePaid: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string | null;
}
